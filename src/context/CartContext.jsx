// Contexto para manejo del carrito de compras
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import indexedDBService from '../services/indexedDBService';
import { cartService } from '../services/api';
import { useOffline } from './OfflineContext';

// Estado inicial del carrito
const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
  lastModified: null,
  isSaved: false,
  isCalculating: false,
  errors: []
};

// Tipos de acciones
const CART_ACTIONS = {
  SET_ITEMS: 'SET_ITEMS',
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  SET_TOTAL: 'SET_TOTAL',
  SET_ITEM_COUNT: 'SET_ITEM_COUNT',
  SET_LAST_MODIFIED: 'SET_LAST_MODIFIED',
  SET_SAVED: 'SET_SAVED',
  SET_CALCULATING: 'SET_CALCULATING',
  SET_ERRORS: 'SET_ERRORS',
  CLEAR_ERRORS: 'CLEAR_ERRORS',
  LOAD_FROM_STORAGE: 'LOAD_FROM_STORAGE',
  SAVE_TO_STORAGE: 'SAVE_TO_STORAGE'
};

// Reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.SET_ITEMS:
      return {
        ...state,
        items: action.payload,
        lastModified: new Date().toISOString()
      };

    case CART_ACTIONS.ADD_ITEM:
      const existingItem = state.items.find(item => item.product_id === action.payload.product_id);
      
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.product_id === action.payload.product_id
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
        return {
          ...state,
          items: updatedItems,
          lastModified: new Date().toISOString()
        };
      } else {
        return {
          ...state,
          items: [...state.items, { ...action.payload, id: Date.now() }],
          lastModified: new Date().toISOString()
        };
      }

    case CART_ACTIONS.REMOVE_ITEM:
      return {
        ...state,
        items: state.items.filter(item => item.product_id !== action.payload),
        lastModified: new Date().toISOString()
      };

    case CART_ACTIONS.UPDATE_QUANTITY:
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.product_id !== action.payload.product_id),
          lastModified: new Date().toISOString()
        };
      } else {
        return {
          ...state,
          items: state.items.map(item =>
            item.product_id === action.payload.product_id
              ? { ...item, quantity: action.payload.quantity }
              : item
          ),
          lastModified: new Date().toISOString()
        };
      }

    case CART_ACTIONS.CLEAR_CART:
      return {
        ...state,
        items: [],
        total: 0,
        itemCount: 0,
        lastModified: new Date().toISOString()
      };

    case CART_ACTIONS.SET_TOTAL:
      return {
        ...state,
        total: action.payload
      };

    case CART_ACTIONS.SET_ITEM_COUNT:
      return {
        ...state,
        itemCount: action.payload
      };

    case CART_ACTIONS.SET_LAST_MODIFIED:
      return {
        ...state,
        lastModified: action.payload
      };

    case CART_ACTIONS.SET_SAVED:
      return {
        ...state,
        isSaved: action.payload
      };

    case CART_ACTIONS.SET_CALCULATING:
      return {
        ...state,
        isCalculating: action.payload
      };

    case CART_ACTIONS.SET_ERRORS:
      return {
        ...state,
        errors: action.payload
      };

    case CART_ACTIONS.CLEAR_ERRORS:
      return {
        ...state,
        errors: []
      };

    case CART_ACTIONS.LOAD_FROM_STORAGE:
      return {
        ...state,
        items: action.payload.items || [],
        lastModified: action.payload.lastModified || null
      };

    default:
      return state;
  }
};

// Crear contexto
const CartContext = createContext();

// Provider
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isOfflineMode, addPendingOperation } = useOffline();

  // Calcular totales cuando cambian los items
  useEffect(() => {
    const calculateTotals = () => {
      dispatch({ type: CART_ACTIONS.SET_CALCULATING, payload: true });
      
      const itemCount = state.items.reduce((total, item) => total + item.quantity, 0);
      const total = state.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      
      dispatch({ type: CART_ACTIONS.SET_ITEM_COUNT, payload: itemCount });
      dispatch({ type: CART_ACTIONS.SET_TOTAL, payload: total });
      dispatch({ type: CART_ACTIONS.SET_CALCULATING, payload: false });
    };

    calculateTotals();
  }, [state.items]);

  // Guardar automáticamente en IndexedDB cuando cambian los items
  useEffect(() => {
    if (state.items.length > 0) {
      saveToStorage();
    }
  }, [state.items, state.lastModified]);

  // Cargar carrito al inicializar
  useEffect(() => {
    if (isOfflineMode) {
      loadFromStorage();
    } else {
      // Intentar cargar desde backend, si falla usar storage
      loadFromBackend().catch(() => {
        console.log('[CartContext] Backend no disponible, usando modo offline');
        loadFromStorage();
      });
    }
  }, [isOfflineMode]);

  // Cargar carrito desde IndexedDB
  const loadFromStorage = useCallback(async () => {
    try {
      const cartItems = await indexedDBService.getCartItems();
      dispatch({
        type: CART_ACTIONS.LOAD_FROM_STORAGE,
        payload: {
          items: cartItems,
          lastModified: cartItems.length > 0 ? cartItems[0]?.added_at : null
        }
      });
    } catch (error) {
      console.error('[CartContext] Error cargando carrito:', error);
      dispatch({
        type: CART_ACTIONS.SET_ERRORS,
        payload: [{ message: 'Error cargando carrito', type: 'load_error' }]
      });
    }
  }, []);

  // Cargar carrito desde backend
  const loadFromBackend = useCallback(async () => {
    try {
      const cartData = await cartService.getCart();
      
      // Convertir items del backend al formato local
      const items = cartData.items?.map(item => ({
        id: item.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_sku: item.product.sku,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
        added_at: item.created_at,
        source: 'text'
      })) || [];

      dispatch({
        type: CART_ACTIONS.SET_ITEMS,
        payload: items
      });
    } catch (error) {
      console.error('[CartContext] Error cargando carrito del backend:', error);
      // Si falla el backend, cargar desde IndexedDB como fallback
      loadFromStorage();
    }
  }, [loadFromStorage]);

  // Guardar carrito en IndexedDB
  const saveToStorage = useCallback(async () => {
    try {
      // Limpiar carrito anterior
      await indexedDBService.clearCart();
      
      // Guardar items actuales
      for (const item of state.items) {
        await indexedDBService.addCartItem(item);
      }
      
      dispatch({ type: CART_ACTIONS.SET_SAVED, payload: true });
    } catch (error) {
      console.error('[CartContext] Error guardando carrito:', error);
      dispatch({
        type: CART_ACTIONS.SET_ERRORS,
        payload: [{ message: 'Error guardando carrito', type: 'save_error' }]
      });
    }
  }, [state.items]);

  // Agregar producto al carrito
  const addItem = useCallback(async (product, quantity = 1, source = 'text') => {
    try {
      // Validar stock
      if (product.stock < quantity) {
        throw new Error(`Stock insuficiente. Disponible: ${product.stock}`);
      }

      // Crear item del carrito
      const cartItem = {
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        quantity,
        unit_price: product.price,
        subtotal: quantity * product.price,
        added_at: new Date().toISOString(),
        source // 'text' o 'voice'
      };

      if (isOfflineMode) {
        // Modo offline - usar IndexedDB
        dispatch({
          type: CART_ACTIONS.ADD_ITEM,
          payload: cartItem
        });

        await addPendingOperation({
          operation_type: 'CREATE',
          entity_type: 'cart_item',
          data: cartItem,
          priority: 3 // Baja prioridad
        });
      } else {
        // Modo online - intentar usar backend
        try {
          await cartService.addProduct(product.id, quantity);
          
          // Actualizar estado local
          dispatch({
            type: CART_ACTIONS.ADD_ITEM,
            payload: cartItem
          });
        } catch (apiError) {
          // Si falla la API, usar modo offline
          console.warn('[CartContext] API falló, usando modo offline:', apiError);
          dispatch({
            type: CART_ACTIONS.ADD_ITEM,
            payload: cartItem
          });
        }
      }

      return true;
    } catch (error) {
      console.error('[CartContext] Error agregando item:', error);
      dispatch({
        type: CART_ACTIONS.SET_ERRORS,
        payload: [{ message: error.message, type: 'add_error' }]
      });
      throw error;
    }
  }, [isOfflineMode, addPendingOperation]);

  // Remover producto del carrito
  const removeItem = useCallback(async (productId) => {
    try {
      if (isOfflineMode) {
        // Modo offline
        dispatch({
          type: CART_ACTIONS.REMOVE_ITEM,
          payload: productId
        });

        await addPendingOperation({
          operation_type: 'DELETE',
          entity_type: 'cart_item',
          data: { product_id: productId },
          priority: 3
        });
      } else {
        // Modo online - usar backend
        try {
          // Buscar el item en el carrito local para obtener su ID
          const localItem = state.items.find(item => item.product_id === productId);
          if (localItem && localItem.id) {
            await cartService.removeItem(localItem.id);
          }
        } catch (apiError) {
          console.warn('[CartContext] API falló al remover item:', apiError);
        }

        // Actualizar estado local
        dispatch({
          type: CART_ACTIONS.REMOVE_ITEM,
          payload: productId
        });
      }

      return true;
    } catch (error) {
      console.error('[CartContext] Error removiendo item:', error);
      throw error;
    }
  }, [isOfflineMode, addPendingOperation, state.items]);

  // Actualizar cantidad de un producto
  const updateQuantity = useCallback(async (productId, quantity) => {
    try {
      if (quantity <= 0) {
        return await removeItem(productId);
      }

      if (isOfflineMode) {
        // Modo offline
        dispatch({
          type: CART_ACTIONS.UPDATE_QUANTITY,
          payload: { product_id: productId, quantity }
        });

        await addPendingOperation({
          operation_type: 'UPDATE',
          entity_type: 'cart_item',
          data: { product_id: productId, quantity },
          priority: 3
        });
      } else {
        // Modo online - usar backend
        try {
          // Buscar el item en el carrito local para obtener su ID
          const localItem = state.items.find(item => item.product_id === productId);
          if (localItem && localItem.id) {
            await cartService.updateItem(localItem.id, quantity);
          }
        } catch (apiError) {
          console.warn('[CartContext] API falló al actualizar cantidad:', apiError);
        }

        // Actualizar estado local
        dispatch({
          type: CART_ACTIONS.UPDATE_QUANTITY,
          payload: { product_id: productId, quantity }
        });
      }

      return true;
    } catch (error) {
      console.error('[CartContext] Error actualizando cantidad:', error);
      throw error;
    }
  }, [isOfflineMode, addPendingOperation, removeItem, state.items]);

  // Limpiar carrito
  const clearCart = useCallback(async () => {
    try {
      if (isOfflineMode) {
        // Modo offline
        dispatch({ type: CART_ACTIONS.CLEAR_CART });
        await indexedDBService.clearCart();
      } else {
        // Modo online - usar backend
        try {
          await cartService.clearCart();
        } catch (apiError) {
          console.warn('[CartContext] API falló al limpiar carrito:', apiError);
        }

        // Actualizar estado local
        dispatch({ type: CART_ACTIONS.CLEAR_CART });
      }

      return true;
    } catch (error) {
      console.error('[CartContext] Error limpiando carrito:', error);
      throw error;
    }
  }, [isOfflineMode]);

  // Validar stock de todos los items
  const validateStock = useCallback(async () => {
    try {
      const validationErrors = [];
      
      for (const item of state.items) {
        const product = await indexedDBService.getProduct(item.product_id);
        if (!product) {
          validationErrors.push({
            product_id: item.product_id,
            product_name: item.product_name,
            message: 'Producto no encontrado'
          });
        } else if (product.stock < item.quantity) {
          validationErrors.push({
            product_id: item.product_id,
            product_name: item.product_name,
            message: `Stock insuficiente. Disponible: ${product.stock}, Solicitado: ${item.quantity}`
          });
        }
      }

      if (validationErrors.length > 0) {
        dispatch({
          type: CART_ACTIONS.SET_ERRORS,
          payload: validationErrors
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('[CartContext] Error validando stock:', error);
      return false;
    }
  }, [state.items]);

  // Obtener item del carrito
  const getItem = useCallback((productId) => {
    return state.items.find(item => item.product_id === productId);
  }, [state.items]);

  // Verificar si un producto está en el carrito
  const hasItem = useCallback((productId) => {
    return state.items.some(item => item.product_id === productId);
  }, [state.items]);

  // Obtener cantidad de un producto en el carrito
  const getItemQuantity = useCallback((productId) => {
    const item = getItem(productId);
    return item ? item.quantity : 0;
  }, [getItem]);

  // Aplicar descuento
  const applyDiscount = useCallback((discountAmount) => {
    const newTotal = Math.max(0, state.total - discountAmount);
    dispatch({ type: CART_ACTIONS.SET_TOTAL, payload: newTotal });
  }, [state.total]);

  // Limpiar errores
  const clearErrors = useCallback(() => {
    dispatch({ type: CART_ACTIONS.CLEAR_ERRORS });
  }, []);

  // Forzar guardado
  const forceSave = useCallback(async () => {
    try {
      await saveToStorage();
      return true;
    } catch (error) {
      console.error('[CartContext] Error en guardado forzado:', error);
      return false;
    }
  }, [saveToStorage]);

  // Acciones del contexto
  const actions = {
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    validateStock,
    getItem,
    hasItem,
    getItemQuantity,
    applyDiscount,
    clearErrors,
    forceSave,
    loadFromStorage,
    loadFromBackend,
    saveToStorage
  };

  // Valores computados
  const computed = {
    isEmpty: state.items.length === 0,
    hasErrors: state.errors.length > 0,
    isModified: !state.isSaved,
    averageItemPrice: state.items.length > 0 ? state.total / state.itemCount : 0,
    uniqueProducts: state.items.length,
    totalWithTax: state.total * 1.16, // IVA del 16%
    taxAmount: state.total * 0.16
  };

  const value = {
    // Estado
    ...state,
    ...computed,
    
    // Acciones
    ...actions
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Hook para usar el contexto
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de CartProvider');
  }
  return context;
};

export default CartContext;
