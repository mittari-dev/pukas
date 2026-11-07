import { describe, expect, test } from 'vitest';
import { nomeDaSerie, serieNoIdioma, slugDaSerie, slugValido } from './series';

const linha = { slug: 'memoria-operaria', nome: 'Memória Operária', nome_es: 'Memoria Obrera', descricao: 'pt', descricao_es: 'es', selo: 'MEMÓRIA OPERÁRIA*', selo_es: 'MEMORIA OBRERA*', ativa: true };

describe('séries', () => {
  test('endereço sai do nome, sem acento nem espaço', () => {
    expect(slugDaSerie('Memória Operária')).toBe('memoria-operaria');
    expect(slugDaSerie('  Greves & Revoltas: 1917! ')).toBe('greves-revoltas-1917');
    expect(slugValido('memoria-operaria')).toBe(true);
    expect(slugValido('Com Espaço')).toBe(false);
    expect(slugValido('-solto')).toBe(false);
  });

  test('nome, descrição e selo no idioma da página', () => {
    expect(serieNoIdioma(linha, 'es')).toEqual({ slug: 'memoria-operaria', nome: 'Memoria Obrera', descricao: 'es', selo: 'MEMORIA OBRERA*' });
    expect(serieNoIdioma(linha, 'pt').nome).toBe('Memória Operária');
    expect(nomeDaSerie([linha], 'memoria-operaria')).toBe('Memória Operária');
    expect(nomeDaSerie([linha], null)).toBeUndefined();
  });
});
