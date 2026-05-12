/**
 * Utilitário de parsing do RA (Registro Acadêmico)
 *
 * Estrutura do RA — 13 dígitos numéricos:
 *   Posições 0-2  (3 dígitos) → código da unidade Fatec
 *   Posições 3-5  (3 dígitos) → código do curso
 *   Posições 6-7  (2 dígitos) → ano de ingresso (ex: 26 = 2026)
 *   Posição  8    (1 dígito)  → semestre de ingresso (1 = 1º sem, 2 = 2º sem)
 *   Posição  9    (1 dígito)  → turno (1=Manhã, 2=Tarde, 3=Noite, 7=EaD)
 *   Posições 10-12 (3 dígitos) → sequencial de matrícula na unidade
 *
 * Exemplo: 2160902611001
 *           216  = unidade (ex: Fatec Americana)
 *               090  = curso (Automação Industrial)
 *                  26   = ano 2026
 *                    1  = 1º semestre
 *                     1 = turno Manhã
 *                      001 = sequencial
 */

// ─── Unidades ─────────────────────────────────────────────────────────────────
const UNIDADES = {
  // '216': 'Fatec Americana',
  // Adicione o código da unidade quando disponível
};

// ─── Cursos ───────────────────────────────────────────────────────────────────
// Chave: 3 dígitos das posições 3-5 do RA
const CURSOS = {
  '090': 'Automação Industrial',
  '139': 'Desenvolvimento de Software Multiplataforma',
  '064': 'Gestão Empresarial',
  '076': 'Gestão Financeira',
  '069': 'Manutenção Industrial',
  '029': 'Redes de Computadores',
  '061': 'Sistemas Biomédicos',
};

// ─── Turnos ───────────────────────────────────────────────────────────────────
// Chave: 1 dígito da posição 9 do RA
const TURNOS_MAP = {
  '1': 'Manhã',
  '2': 'Tarde',
  '3': 'Noite',
  '7': 'EaD',
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
 * @returns {{ unidadeCodigo: string, cursoCodigo: string, anoIngresso: string, semestreIngresso: string, turnoCode: string, sequencial: string } | null}
 */
export function parseRA(ra) {
  const { limpo, valido } = limparRA(ra);
  if (!valido) return null;

  return {
    unidadeCodigo:   limpo.slice(0, 3),
    cursoCodigo:     limpo.slice(3, 6),
    anoIngresso:     limpo.slice(6, 8),
    semestreIngresso: limpo.slice(8, 9),
    turnoCode:       limpo.slice(9, 10),
    sequencial:      limpo.slice(10, 13),
  };
}

/**
 * Retorna o nome do curso com base no RA.
 * @param {string} ra
 * @returns {string}
 */
export function inferirCurso(ra) {
  const partes = parseRA(ra);
  if (!partes) return '';

  return CURSOS[partes.cursoCodigo] || `Curso ${partes.cursoCodigo}`;
}

/**
 * Retorna o nome do turno com base no RA.
 * @param {string} ra
 * @returns {string}
 */
export function inferirTurno(ra) {
  const partes = parseRA(ra);
  if (!partes) return '';

  return TURNOS_MAP[partes.turnoCode] || `Turno ${partes.turnoCode}`;
}

/**
 * Retorna o semestre de ingresso (1 ou 2) com base no RA.
 * @param {string} ra
 * @returns {string}
 */
export function inferirSemestreIngresso(ra) {
  const partes = parseRA(ra);
  if (!partes) return '';

  return partes.semestreIngresso === '1' ? '1º Semestre' : partes.semestreIngresso === '2' ? '2º Semestre' : '';
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
