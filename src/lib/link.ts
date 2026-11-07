// Link externo seguro: só http(s). Barra javascript:, data: e afins, que rodariam código no site ao clicar.
export const ehLinkWeb = (u: string) => /^https?:\/\//i.test(u.trim());
export const linkWeb = (u: string | null | undefined): string | undefined => (u && ehLinkWeb(u) ? u.trim() : undefined);
