// lib/store.ts
import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import storage from "redux-persist/lib/storage";
import authReducer from "../features/auth/authSlice";
import stateReconciler from "./reconciler";
import quizReducer from "../features/quiz/quizSlice";
import { Action, AnyAction } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";

const appReducer = combineReducers({
  auth: authReducer,
  quiz: quizReducer,
});

const rootReducer = (
  state: ReturnType<typeof appReducer> | undefined,
  action: Action | AnyAction
) => {
  return appReducer(state, action);
};

const persistConfig = {
  key: "root",
  storage,
  transforms: [stateReconciler],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const makeStore = () => {
  const store = configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [
            "persist/PERSIST",
            "persist/REHYDRATE",
            "persist/FLUSH",
            "persist/PAUSE",
            "persist/PURGE",
            "persist/REMOVE",
          ],
        },
      }),
  });

  // Create and return the persistor alongside the store
  const persistor = persistStore(store);

  return { store, persistor };
};

// Define the types for the entire store
export type AppStore = ReturnType<typeof makeStore>["store"];
export type AppPersistor = ReturnType<typeof makeStore>["persistor"];
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = AppStore["dispatch"];
