import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

const CafeContext = createContext();

export const CafeProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);

  // --- AUTHENTICATION STATE ---
  const [currentStaff, setCurrentStaff] = useState(() => {
    const saved = localStorage.getItem('cafe_current_staff');
    return saved ? JSON.parse(saved) : null;
  });

  const [cafeProfile, setCafeProfile] = useState({
    name: 'The Velvet Bean',
    phone: '+91 98765 43210',
    address: 'Plot 42, Hitech City, Hyderabad, India',
    gstNumber: '36AAAAA1111A1Z1',
    logo: '☕',
    theme: 'light',
    currency: '₹',
    gstPercentage: 5,
    loyaltyEarnRate: 5,
    loyaltyRedeemRate: 0.1,
  });

  const [menu, setMenu] = useState([]);
  const [tables, setTables] = useState([]);
  const [crm, setCrm] = useState({});
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [staff, setStaff] = useState([]);
  const [activeCustomerSessions, setActiveCustomerSessions] = useState(() => {
    const saved = localStorage.getItem('cafe_customer_sessions');
    return saved ? JSON.parse(saved) : {};
  });
  const [otpNotifications, setOtpNotifications] = useState([]);

  useEffect(() => {
    if (currentStaff) {
      localStorage.setItem('cafe_current_staff', JSON.stringify(currentStaff));
    } else {
      localStorage.removeItem('cafe_current_staff');
    }
  }, [currentStaff]);

  useEffect(() => {
    localStorage.setItem('cafe_customer_sessions', JSON.stringify(activeCustomerSessions));
  }, [activeCustomerSessions]);

  // --- SUPABASE DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cafesRes, settingsRes, catsRes, menuRes, tablesRes, customersRes, ordersRes, orderItemsRes, paymentsRes, staffRes] = await Promise.all([
          supabase.from('cafes').select('*').limit(1),
          supabase.from('settings').select('*').limit(1),
          supabase.from('menu_categories').select('*'),
          supabase.from('menu_items').select('*'),
          supabase.from('tables').select('*').order('id', { ascending: true }),
          supabase.from('customers').select('*'),
          supabase.from('orders').select('*').order('timestamp', { ascending: false }),
          supabase.from('order_items').select('*'),
          supabase.from('payments').select('*, bills(bill_number, orders(table_id, customer_id))').order('timestamp', { ascending: false }),
          supabase.from('staff').select('*').order('id', { ascending: true })
        ]);

        let cafeId = null;
        if (cafesRes.data && cafesRes.data.length > 0) {
          const cafe = cafesRes.data[0];
          cafeId = cafe.id;
          const settings = settingsRes.data && settingsRes.data.length > 0 ? settingsRes.data[0] : {};
          setCafeProfile(prev => ({ 
            ...prev, 
            id: cafe.id, 
            name: cafe.name,
            phone: cafe.phone,
            address: cafe.address,
            gstNumber: cafe.gstin,
            logo: cafe.logo_url || '☕',
            theme: cafe.theme || 'light',
            currency: settings.currency || '₹',
            gstPercentage: settings.gst_percentage || 5,
            loyaltyEarnRate: settings.loyalty_earn_rate || 5,
            loyaltyRedeemRate: settings.loyalty_redeem_rate || 0.1
          }));
        }

        let mappedMenu = [];
        if (menuRes.data) {
          mappedMenu = menuRes.data.map(item => {
            const cat = catsRes.data?.find(c => c.id === item.category_id);
            return {
              ...item,
              category: cat ? cat.name : 'Uncategorized',
              addOns: []
            };
          });
          setMenu(mappedMenu);
        }

        if (tablesRes.data) {
          setTables(tablesRes.data.map(t => ({ ...t, currentSession: t.current_session })));
        }

        if (customersRes.data) {
          const crmDict = {};
          customersRes.data.forEach(c => {
            crmDict[c.mobile] = { ...c, totalSpend: c.total_spend, lastVisit: c.last_visit };
          });
          setCrm(crmDict);
        }

        if (ordersRes.data) {
          const mappedOrders = ordersRes.data.map(o => {
             const items = (orderItemsRes.data || []).filter(i => i.order_id === o.id).map(i => ({
               id: i.item_id,
               qty: i.qty,
               price: i.price,
               name: i.variant_name || 'Item'
             }));
             return { ...o, tableId: o.table_id, sessionMobile: o.customer_id, items, orderNumber: o.order_number || o.id };
          });
          setOrders(mappedOrders);
        }

        if (paymentsRes.data) {
          setPayments(paymentsRes.data.map(p => {
            const order = p.bills?.orders || {};
            const tableId = order.table_id;
            const customerId = order.customer_id;
            
            const table = tablesRes.data?.find(t => t.id === tableId);
            const tableName = table ? table.name : 'Takeaway';
            
            const customer = customersRes.data?.find(c => c.id === customerId);
            const customerName = customer ? customer.name : 'Walk-in Customer';

            return { 
              ...p, 
              billRef: p.bills?.bill_number || p.bill_id, 
              tableName,
              customerName,
              collectedBy: p.collected_by 
            };
          }));
        }

        if (staffRes.data) {
          setStaff(staffRes.data);
        }
      } catch (err) {
        console.error('Error fetching data from Supabase:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Simplified realtime for MVP Adapter
    const ordersSubscription = supabase.channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        fetchData(); // Brute force refresh to get nested items easily for adapter
      })
      .subscribe();

    const tablesSubscription = supabase.channel('public:tables')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, payload => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
      supabase.removeChannel(tablesSubscription);
    };
  }, []);

  const playKdsChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.log("Audio chime skipped:", e);
    }
  };

  const loginStaff = (email, password) => {
    const creds = {
      'owner@cafeos.com': { pass: 'owner123', name: 'Durlabh (Owner)', role: 'Owner' },
      'manager@cafeos.com': { pass: 'manager123', name: 'Sanjay Kumar', role: 'Manager' },
      'cashier@cafeos.com': { pass: 'cashier123', name: 'Ramesh Cashier', role: 'Counter Operator' },
      'chef@cafeos.com': { pass: 'chef123', name: 'Chef Maria', role: 'Kitchen Staff' }
    };

    const match = creds[email.toLowerCase()];
    if (match && match.pass === password) {
      const staffUser = { email: email.toLowerCase(), name: match.name, role: match.role };
      setCurrentStaff(staffUser);
      return { success: true };
    }
    return { success: false, message: 'Invalid email or password' };
  };

  const logoutStaff = () => {
    setCurrentStaff(null);
  };

  const triggerOtpSms = (mobile) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const newAlert = { id: Date.now(), mobile, code };
    setOtpNotifications(prev => [...prev, newAlert]);
    setTimeout(() => setOtpNotifications(prev => prev.filter(n => n.id !== newAlert.id)), 8000);
    return code;
  };

  const verifyOtp = async (tableId, mobile, name) => {
    setActiveCustomerSessions(prev => ({ ...prev, [tableId]: mobile }));
    
    // Check CRM
    let crmData = crm[mobile];
    if (crmData) {
      crmData = { ...crmData, last_visit: new Date().toISOString().split('T')[0] };
      await supabase.from('customers').update({ last_visit: crmData.last_visit }).eq('mobile', mobile);
    } else {
      crmData = { mobile, name: name || 'Valued Guest', visit_count: 1, total_spend: 0, last_visit: new Date().toISOString().split('T')[0] };
      await supabase.from('customers').insert(crmData);
    }

    setCrm(prev => ({ ...prev, [mobile]: { ...crmData, totalSpend: crmData.total_spend, lastVisit: crmData.last_visit } }));

    const currentSession = { mobile, checkInTime: new Date().toISOString(), billPending: false };
    await supabase.from('tables').update({ status: 'Occupied', current_session: currentSession }).eq('id', tableId);
    
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: 'Occupied', currentSession } : t));
  };

  const logoutCustomerSession = async (tableId) => {
    setActiveCustomerSessions(prev => {
      const copy = { ...prev };
      delete copy[tableId];
      return copy;
    });

    await supabase.from('tables').update({ status: 'Available', current_session: null }).eq('id', tableId);
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: 'Available', currentSession: null } : t));
  };

  const placeOrder = async (tableId, mobile, items, notes, channel = 'Dine-In') => {
    const newOrder = {
      table_id: tableId,
      status: 'New',
      source: channel,
      notes,
      amount: items.reduce((acc, it) => acc + (it.price * it.qty), 0)
    };

    const insertedOrder = await supabase.from('orders').insert(newOrder).select().single();
    
    if (insertedOrder.data) {
      const orderItems = items.map(it => ({
        order_id: insertedOrder.data.id,
        item_id: it.id,
        qty: it.qty,
        price: it.price,
        variant_name: it.name
      }));
      await supabase.from('order_items').insert(orderItems);

      const uiOrder = { ...newOrder, id: insertedOrder.data.id, tableId, sessionMobile: mobile, timestamp: new Date().toISOString(), items };
      setOrders(prev => [uiOrder, ...prev]);
    }

    if (channel === 'Dine-In') {
      const table = tables.find(t => t.id === tableId);
      const session = table?.currentSession || { mobile, checkInTime: new Date().toISOString(), billPending: false };
      await supabase.from('tables').update({ status: 'Occupied', current_session: session }).eq('id', tableId);
    }

    return insertedOrder.data;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
  };

  const getConsolidatedBill = (tableId) => {
    const tableOrders = orders.filter(o => o.tableId === tableId && o.status !== 'Completed' && o.status !== 'Cancelled');
    const subtotal = tableOrders.reduce((acc, order) => acc + order.amount, 0);
    const gstRate = cafeProfile.gstPercentage;
    const gstAmount = Math.round((subtotal * gstRate) / 100);
    const grandTotal = subtotal + gstAmount;

    return { ordersList: tableOrders, subtotal, gstRate, gstAmount, grandTotal };
  };

  const checkoutSession = async (tableId, paymentModes, totalCollected, discountAmount = 0, redeemedPoints = 0) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || !table.currentSession) return;

    const { mobile } = table.currentSession;
    const billDetails = getConsolidatedBill(tableId);
    const netAmount = Math.max(0, billDetails.grandTotal - discountAmount);

    const billRes = await supabase.from('bills').insert({
      subtotal: billDetails.subtotal,
      tax: billDetails.gstAmount,
      discount: discountAmount,
      grand_total: netAmount,
      status: 'Paid'
    }).select().single();

    if (billRes.data) {
      const newPayments = paymentModes.filter(pm => pm.amount > 0).map(pm => ({
        bill_id: billRes.data.id,
        amount: pm.amount,
        mode: pm.mode,
        collected_by: currentStaff ? currentStaff.name : 'System POS'
      }));
      if (newPayments.length > 0) {
        await supabase.from('payments').insert(newPayments);
      }
    }

    // Free Table & Complete Orders
    const activeOrders = orders.filter(o => o.tableId === tableId && o.status !== 'Completed' && o.status !== 'Cancelled');
    const orderIds = activeOrders.map(o => o.id);
    if (orderIds.length > 0) {
      await supabase.from('orders').update({ status: 'Completed' }).in('id', orderIds);
    }

    await supabase.from('tables').update({ status: 'Available', current_session: null }).eq('id', tableId);
    
    // Refresh entirely
    window.location.reload(); 
  };

  const releaseTable = async (tableId) => {
    await supabase.from('tables').update({ status: 'Available', current_session: null }).eq('id', tableId);
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: 'Available', currentSession: null } : t));
  };

  const addMenuItem = async (item) => {
    let catRes = await supabase.from('menu_categories').select('*').eq('name', item.category).single();
    let catId = null;
    if (catRes.data) {
      catId = catRes.data.id;
    } else {
      const newCat = await supabase.from('menu_categories').insert({ name: item.category }).select().single();
      if(newCat.data) catId = newCat.data.id;
    }

    const newItem = {
      category_id: catId,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      status: item.status || 'Active'
    };
    const inserted = await supabase.from('menu_items').insert(newItem).select().single();
    if(inserted.data) {
       setMenu(prev => [...prev, { ...inserted.data, category: item.category, addOns: [] }]);
    }
  };

  const updateMenuItem = async (updatedItem) => {
    let catRes = await supabase.from('menu_categories').select('*').eq('name', updatedItem.category).single();
    let catId = catRes.data ? catRes.data.id : null;
    if(!catId) {
      const newCat = await supabase.from('menu_categories').insert({ name: updatedItem.category }).select().single();
      catId = newCat.data?.id;
    }

    const data = {
      category_id: catId,
      name: updatedItem.name,
      description: updatedItem.description,
      price: updatedItem.price,
      image: updatedItem.image,
      status: updatedItem.status
    };
    await supabase.from('menu_items').update(data).eq('id', updatedItem.id);
    setMenu(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const deleteMenuItem = async (itemId) => {
    await supabase.from('menu_items').update({ status: 'Inactive' }).eq('id', itemId);
    setMenu(prev => prev.map(item => item.id === itemId ? { ...item, status: 'Inactive' } : item));
  };

  const addNewTable = async () => {
    const nextNum = tables.length + 1;
    const tableCode = `T0${nextNum}`;
    const newTable = { table_code: tableCode, name: `Table ${nextNum}`, status: 'Available', current_session: null, capacity: 4 };
    const inserted = await supabase.from('tables').insert(newTable).select().single();
    if (inserted.data) {
      setTables(prev => [...prev, inserted.data]);
    }
  };

  const transferTable = async (oldTableId, newTableId) => {
    // Left empty for brevity, requires similar updates
  };

  const addStaff = async (staffData) => {
    const newStaff = { name: staffData.name, role: staffData.role, status: 'Active' };
    const inserted = await supabase.from('staff').insert(newStaff).select().single();
    if (inserted.data) {
      setStaff(prev => [...prev, inserted.data]);
    }
  };

  const processTakeaway = async (customerMobile, items, notes, paymentModes, totalCollected, discountAmount = 0, redeemedPoints = 0) => {
    alert("Takeaway processing updated for new DB.");
  };

  const updateCafeProfile = async (newProfile) => {
    if (newProfile.id) {
       await supabase.from('cafes').update({
         name: newProfile.name, phone: newProfile.phone, address: newProfile.address, gstin: newProfile.gstNumber
       }).eq('id', newProfile.id);
       await supabase.from('settings').update({
         gst_percentage: newProfile.gstPercentage, loyalty_earn_rate: newProfile.loyaltyEarnRate, loyalty_redeem_rate: newProfile.loyaltyRedeemRate
       }).eq('cafe_id', newProfile.id);
    } else {
       const cafeRes = await supabase.from('cafes').insert({
         name: newProfile.name, phone: newProfile.phone, address: newProfile.address, gstin: newProfile.gstNumber
       }).select().single();
       if(cafeRes.data) {
         newProfile.id = cafeRes.data.id;
         await supabase.from('settings').insert({
           cafe_id: cafeRes.data.id, gst_percentage: newProfile.gstPercentage, loyalty_earn_rate: newProfile.loyaltyEarnRate, loyalty_redeem_rate: newProfile.loyaltyRedeemRate
         });
       }
    }
    setCafeProfile(newProfile);
  };

  const regenerateTableQR = async (tableId) => {
    await releaseTable(tableId);
  };

  return (
    <CafeContext.Provider value={{
      currentStaff, loginStaff, logoutStaff,
      cafeProfile, setCafeProfile, menu, tables, crm, payments, orders, staff, otpNotifications, activeCustomerSessions,
      triggerOtpSms, verifyOtp, logoutCustomerSession, placeOrder, updateOrderStatus, getConsolidatedBill, checkoutSession,
      releaseTable, addMenuItem, updateMenuItem, deleteMenuItem, addNewTable, transferTable, addStaff, processTakeaway,
      updateCafeProfile, regenerateTableQR
    }}>
      {children}
    </CafeContext.Provider>
  );
};

export const useCafe = () => {
  const context = useContext(CafeContext);
  if (!context) {
    throw new Error('useCafe must be used within a CafeProvider');
  }
  return context;
};
