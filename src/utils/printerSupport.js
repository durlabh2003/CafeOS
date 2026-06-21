/**
 * ESC/POS Thermal Printing Integration via Web Bluetooth
 * 
 * Provides a module to connect to standard 58mm/80mm thermal receipt printers.
 * If Bluetooth is unavailable or user cancels, falls back to a simulated console print.
 */

export const printKOT = async (order, tableName) => {
  const kotText = generateKOTText(order, tableName);
  
  if (!navigator.bluetooth) {
    console.warn("Web Bluetooth API not available. Simulating KOT print.");
    simulatePrint(kotText);
    return { success: false, message: 'Bluetooth not supported. Simulated print.' };
  }

  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }], // Standard ESC/POS service UUID
      optionalServices: ['e7810a71-73ae-499d-8c15-faa9aef0c3f2']
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
    const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

    const encoder = new TextEncoder();
    const data = encoder.encode(kotText);

    // ESC/POS requires sending data in chunks (typically 512 bytes for BLE)
    const CHUNK_SIZE = 512;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      await characteristic.writeValue(chunk);
    }

    // Cut paper command: GS V 0
    const cutCommand = new Uint8Array([0x1d, 0x56, 0x00]);
    await characteristic.writeValue(cutCommand);

    return { success: true, message: 'KOT Printed Successfully' };
  } catch (error) {
    console.error("Printer connection failed:", error);
    simulatePrint(kotText);
    return { success: false, message: 'Printer failed. Simulated print instead.', error };
  }
};

const generateKOTText = (order, tableName) => {
  // Basic ESC/POS formatting
  const ESC = '\x1b';
  const ALIGN_CENTER = ESC + 'a' + '\x01';
  const ALIGN_LEFT = ESC + 'a' + '\x00';
  const BOLD_ON = ESC + 'E' + '\x01';
  const BOLD_OFF = ESC + 'E' + '\x00';
  const TEXT_DOUBLE_HEIGHT = ESC + '!' + '\x10';
  const TEXT_NORMAL = ESC + '!' + '\x00';

  let text = '';
  text += ALIGN_CENTER + BOLD_ON + TEXT_DOUBLE_HEIGHT + 'KITCHEN ORDER TICKET\n' + TEXT_NORMAL + BOLD_OFF;
  text += ALIGN_LEFT + '--------------------------------\n';
  text += `Order #: ${order.orderNumber || order.id.slice(0, 8)}\n`;
  text += `Table:   ${tableName}\n`;
  text += `Time:    ${new Date(order.timestamp || Date.now()).toLocaleTimeString()}\n`;
  text += `Type:    ${order.source || 'Dine-In'}\n`;
  text += '--------------------------------\n';
  text += 'QTY   ITEM\n';
  text += '--------------------------------\n';

  order.items.forEach(item => {
    const qtyStr = item.qty.toString().padEnd(6);
    text += `${BOLD_ON}${qtyStr}${item.name}${BOLD_OFF}\n`;
    if (item.variant) text += `      - ${item.variant}\n`;
    if (item.addOns && item.addOns.length > 0) {
      text += `      + ${item.addOns.join(', ')}\n`;
    }
  });

  text += '--------------------------------\n';
  if (order.notes) {
    text += `NOTES:\n${order.notes}\n`;
    text += '--------------------------------\n';
  }
  
  text += '\n\n\n'; // Feed paper
  return text;
};

const simulatePrint = (text) => {
  // For development without hardware
  const cleanText = text.replace(/\x1b[a-zA-Z!][\x00-\x10]?/g, ''); // strip ESC codes
  console.log("%c🖨️ [SIMULATED PRINTER OUTPUT]", "color: #2563eb; font-weight: bold; font-size: 14px;");
  console.log(cleanText);
};
