// Redes do PUKAS, no topo da /links. Rede sem endereço não aparece: quando criar o perfil, é só preencher a url.
export interface Rede {
  nome: string;
  url: string;
  // Desenho do ícone (viewBox 0 0 24 24, traço), sem logo de marca.
  icone: string;
}

export const redes: Rede[] = [
  { nome: 'YouTube', url: '', icone: 'M3 7.5c0-1.4 1-2.5 2.4-2.6C7.6 4.7 9.8 4.6 12 4.6s4.4.1 6.6.3C20 5 21 6.1 21 7.5v9c0 1.4-1 2.5-2.4 2.6-2.2.2-4.4.3-6.6.3s-4.4-.1-6.6-.3C4 19 3 17.9 3 16.5zM10 9v6l5-3z' },
  { nome: 'Instagram', url: '', icone: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM17.5 6.5v.01' },
  { nome: 'X', url: '', icone: 'M4 4l16 16M20 4L4 20' },
];
