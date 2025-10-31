// store/reconciler.ts
import { createTransform, Transform } from "redux-persist";

// Define the keys you want to blacklist from being persisted within each slice
const blacklistedFields = ["loading", "status", "error", "message"] as const;

// Generic type for slice state
type PersistedState = Record<string, unknown> & {
  loading?: boolean;
  status?: string;
  error?: string | null;
  message?: string;
};

// Create the transform
const stateReconciler: Transform<PersistedState, PersistedState> = createTransform(
  // (1) Transform state on its way to being serialized and persisted.
  inboundState => {
    if (!inboundState) return inboundState;

    // Remove the blacklisted fields
    const newState = { ...inboundState };
    for (const field of blacklistedFields) {
      delete (newState as Record<string, unknown>)[field];
    }

    return newState;
  },

  // (2) Transform state being rehydrated
  outboundState => {
    if (!outboundState) return outboundState;

    return {
      ...outboundState,
      loading: false,
      status: "idle",
      error: null,
      message: "",
    };
  },

  // (3) Define which reducers this transform should be applied to
  { whitelist: ["auth"] }
);

export default stateReconciler;
