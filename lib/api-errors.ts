import axios from "axios";

export function getApiErrorStatus(error: unknown) {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Não foi possível concluir a ação. Tente novamente.",
) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === "object" && data !== null) {
      if ("message" in data && typeof data.message === "string") {
        return data.message;
      }

      if ("error" in data && typeof data.error === "string") {
        return data.error;
      }
    }
    if (!error.response) {
      return error.code === "ECONNABORTED" || error.code === "ETIMEDOUT"
        ? "A solicitação demorou mais que o esperado. Tente novamente."
        : "Não foi possível conectar ao serviço. Tente novamente.";
    }
  }

  return fallback;
}
