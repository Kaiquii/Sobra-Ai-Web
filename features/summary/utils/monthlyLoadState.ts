export type MonthlyLoadState = {
  requestKey: string;
  status: "loading" | "success" | "error";
  error: string | null;
};

export function getMonthlyLoadFeedback(state: MonthlyLoadState, requestKey: string) {
  const isCurrentRequest = state.requestKey === requestKey;
  return {
    isLoading: !isCurrentRequest || state.status === "loading",
    error: isCurrentRequest && state.status === "error" ? state.error : null,
  };
}
