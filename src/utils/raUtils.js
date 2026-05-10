/**
 * Utilitário de parsing do RA (Registro Acadêmico)
 *
 * Estrutura do RA — 13 dígitos numéricos:
 *   Posições 0-2  (3 dígitos) → código da unidade (ex: 094 = Fatec Americana)
 *   Posições 3-5  (3 dígitos) → código do curso
 *   Posições 6-12 (7 dígitos) → ano, semestre e sequencial do aluno
 *
 * Exemplo: 0940012024001
 *           094  = unidade
 *               001  = curso
 *                  2024001 = ano/semestre/seq
 */

// ─── Unidades ─────────────────────────────────────────────────────────────────
// Adicione o código da sua unidade aqui
const UNIDADES = {
  // '094': 'Fatec Americana',
  // Preencher com o código real da unidade quando disponível
};

// ─── Cursos ───────────────────────────────────────────────────────────────────
// Os códigos de curso serão adicionados aqui quando fornecidos
// Chave: 3 dígitos das posições 3-5 do RA
const CURSOS = {
  // '001': 'Automação Industrial',
  // '002': 'Desenvolvimento de Software Multiplataforma',
  // '003': 'Gestão Empresarial (EaD)',
  // '004': 'Gestão Financeira',
  // '005': 'Manutenção Industrial',
  // '006': 'Redes de Computadores',
  // '007': 'Sistemas Biomédicos',
  // Preencher com os códigos reais quando disponíveis
};

/**
 * Remove não-dígitos e valida se o RA tem exatamente 13 dígitos.
 * @param {string} ra
 * @returns {{ valido: boolean, limpo: string }}
 */
export function limparRA(ra) {
  const limpo = String(ra || '').replace(/\D/g, '');
  return { limpo, valido: limpo.length === 13 };
}

/**
 * Extrai as partes do RA.
 * @param {string} ra — pode conter formatação
 * @returns {{ unidadeCodigo: string, cursoCodigo: string, sequencial: string } | null}
 */
export function parseRA(ra) {
  const { limpo, valido } = limparRA(ra);
  if (!valido) return null;

  return {
    unidadeCodigo: limpo.slice(0, 3),
    cursoCodigo:   limpo.slice(3, 6),
    sequencial:    limpo.slice(6),
  };
}

/**
 * Retorna o nome do curso com base no RA.
 * Enquanto os códigos não estiverem cadastrados, exibe o código extraído.
 * @param {string} ra
 * @returns {string}
 */
export function inferirCurso(ra) {
  const partes = parseRA(ra);
  if (!partes) return '';

  const nomeCurso = CURSOS[partes.cursoCodigo];
  if (nomeCurso) return nomeCurso;

  // Fallback: exibe o código até os cursos serem cadastrados
  return `Curso ${partes.cursoCodigo} (código a cadastrar)`;
}

/**
 * Retorna o nome da unidade com base no RA.
 * @param {string} ra
 * @returns {string}
 */
export function inferirUnidade(ra) {
  const partes = parseRA(ra);
  if (!partes) return '';

  return UNIDADES[partes.unidadeCodigo] || `Unidade ${partes.unidadeCodigo}`;
}

/**
 * Formata o RA para exibição: XXX.XXX.XXXXXXX
 * @param {string} ra
 * @returns {string}
 */
export function formatarRA(ra) {
  const { limpo, valido } = limparRA(ra);
  if (!valido) return limpo;
  return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6)}`;
}
