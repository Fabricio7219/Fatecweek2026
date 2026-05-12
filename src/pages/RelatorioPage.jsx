import { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { eventService } from '../services/eventService';
import { reportService } from '../services/reportService';

const CURSOS = [
  'Automação Industrial',
  'Desenvolvimento de Software Multiplataforma',
  'Gestão Empresarial (EaD)',
  'Gestão Financeira',
  'Manutenção Industrial',
  'Redes de Computadores',
  'Sistemas Biomédicos',
];

const SEMESTRES = ['1', '2', '3', '4', '5', '6', '7', '8'];
const TURNOS = ['Manhã', 'Tarde', 'Noite', 'EaD'];

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function resolveDateValue(linha, candidates) {
  for (const key of candidates) {
    const value = linha[key];
    if (value) return value;
  }
  return null;
}

function normalizeText(value) {
  return (value || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function resolveCourseValue(linha) {
  return (
    linha.courseName ||
    linha.course ||
    linha.courseTitle ||
    linha.curso ||
    linha.nomeCurso ||
    linha.className ||
    'Não informado'
  );
}

function resolveSemesterValue(linha) {
  return (
    linha.semester ||
    linha.semestre ||
    linha.period ||
    linha.periodo ||
    linha.term ||
    ''
  ).toString();
}

function resolveShiftValue(linha) {
  return (
    linha.shift ||
    linha.turno ||
    linha.timeOfDay ||
    linha.schedule ||
    ''
  ).toString();
}

function resolveEntryMethod(linha) {
  return (
    linha.entryMethod ||
    linha.metodoEntrada ||
    linha.checkInMethod ||
    linha.inputMethod ||
    '—'
  );
}

function resolveExitMethod(linha) {
  return (
    linha.exitMethod ||
    linha.metodoSaida ||
    linha.checkOutMethod ||
    linha.outputMethod ||
    '—'
  );
}

function resolvePhotoLinked(linha) {
  const value = linha.photoLinked ?? linha.fotoVinculada ?? linha.hasFaceEnrollment ?? linha.hasPhoto ?? linha.isValid ?? linha.faceValidado ?? linha.FaceValidado;
  if (value === true || value === 1) return 'Sim';
  if (value === false || value === 0) return 'Não';
  return '—';
}

function resolveValidValue(linha) {
  const value = linha.isValid ?? linha.presencaValida ?? linha.PresencaValida;
  if (typeof value === 'boolean') return value;
  return null;
}

export default function RelatorioPage() {
  const [eventos, setEventos] = useState([]);
  const [eventoSelecionado, setEventoSelecionado] = useState('');
  const [dados, setDados] = useState([]);
  const [cursoSelecionado, setCursoSelecionado] = useState('TODOS');
  const [semestreSelecionado, setSemestreSelecionado] = useState('TODOS');
  const [turnoSelecionado, setTurnoSelecionado] = useState('TODOS');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // Estado da aba ativa
  const [abaAtiva, setAbaAtiva] = useState('porEvento'); // 'porEvento' | 'consolidado'

  // Estado do relatório consolidado
  const [eventosSelecionados, setEventosSelecionados] = useState([]);
  const [consolidado, setConsolidado] = useState(null);
  const [loadingConsolidado, setLoadingConsolidado] = useState(false);
  const [erroConsolidado, setErroConsolidado] = useState('');

  const toggleEvento = (id) => {
    setEventosSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCarregarConsolidado = async () => {
    if (eventosSelecionados.length === 0) {
      setErroConsolidado('Selecione ao menos um evento.');
      return;
    }
    setLoadingConsolidado(true);
    setErroConsolidado('');
    setConsolidado(null);
    try {
      const data = await reportService.getConsolidated(eventosSelecionados);
      setConsolidado(data);
    } catch {
      setErroConsolidado('Não foi possível carregar o relatório consolidado.');
    } finally {
      setLoadingConsolidado(false);
    }
  };

  useEffect(() => {
    async function carregarEventos() {
      try {
        const lista = await eventService.list();
        setEventos(lista);
        if (lista.length > 0) {
          setEventoSelecionado(lista[0].id);
        }
      } catch {
        setErro('Nao foi possivel carregar eventos.');
      }
    }

    carregarEventos();
  }, []);

  useEffect(() => {
    if (!eventoSelecionado) return;

    async function carregarRelatorio() {
      try {
        setLoading(true);
        setErro('');
        const response = await reportService.getAttendanceByEvent(eventoSelecionado);
        const lista = Array.isArray(response) ? response : [];
        setDados(Array.isArray(lista) ? lista : []);
      } catch {
        setDados([]);
        setErro('Nao foi possivel carregar registros deste evento no momento.');
      } finally {
        setLoading(false);
      }
    }

    carregarRelatorio();
  }, [eventoSelecionado]);

  const eventoAtual = useMemo(
    () => eventos.find(ev => ev.id === eventoSelecionado),
    [eventos, eventoSelecionado]
  );

  const regra = {
    minimumStayMinutes: eventoAtual?.minimumStayMinutes ?? eventoAtual?.tempoMinimoMinutos ?? 0,
    scoreValue: eventoAtual?.scoreValue ?? eventoAtual?.pontuacao ?? 0,
  };

  const regraConfigurada = regra.minimumStayMinutes > 0 || regra.scoreValue > 0;

  const dadosFiltrados = useMemo(() => {
    return dados.filter((linha) => {
      const cursoLinha = resolveCourseValue(linha);
      const semestreLinha = resolveSemesterValue(linha);
      const turnoLinha = resolveShiftValue(linha);

      const cursoOk =
        cursoSelecionado === 'TODOS' ||
        normalizeText(cursoLinha) === normalizeText(cursoSelecionado);

      const semestreOk =
        semestreSelecionado === 'TODOS' ||
        normalizeText(semestreLinha) === normalizeText(semestreSelecionado);

      const turnoOk =
        turnoSelecionado === 'TODOS' ||
        normalizeText(turnoLinha) === normalizeText(turnoSelecionado);

      return cursoOk && semestreOk && turnoOk;
    });
  }, [dados, cursoSelecionado, semestreSelecionado, turnoSelecionado]);

  const handleExportPDF = () => {
    const nomeEvento = eventoAtual?.name || eventoAtual?.nomeEvento || `Evento ${eventoSelecionado}`;
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(16);
    doc.setTextColor(196, 30, 58);
    doc.text(`Relatório de Presenças — ${nomeEvento}`, 14, 16);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 23);
    doc.text(`Total de registros: ${dadosFiltrados.length}`, 14, 29);

    const linhas = dadosFiltrados.map((linha) => {
      const permanencia = toNumber(
        linha.stayMinutes ?? linha.tempoPermanenciaMinutos ?? linha.TempoPermanenciaMinutos ?? linha.permanenciaMinutos ?? linha.durationMinutes ?? linha.duration,
        0
      );
      const minimo = toNumber(linha.minimumStayMinutes ?? linha.tempoMinimoMinutos ?? regra.minimumStayMinutes, 0);
      const validoApi = resolveValidValue(linha);
      const valido = typeof validoApi === 'boolean' ? validoApi : (minimo > 0 ? permanencia >= minimo : true);
      const pontosBase = toNumber(linha.scoreValue ?? linha.pontuacao ?? linha.Pontuacao ?? regra.scoreValue, 0);
      const pontosFinalApi = linha.finalScore ?? linha.pontosFinais ?? linha.totalPoints;
      const pontosFinais = (pontosFinalApi != null && Number.isFinite(Number(pontosFinalApi))) ? Number(pontosFinalApi) : (valido ? pontosBase : 0);
      const entrada = resolveDateValue(linha, ['entryTime', 'checkInAt', 'entryAt', 'entradaEm', 'checkIn', 'HorarioEntrada', 'horarioEntrada']);
      const saida   = resolveDateValue(linha, ['exitTime', 'checkOutAt', 'exitAt', 'saidaEm', 'checkOut', 'HorarioSaida', 'horarioSaida']);

      return [
        resolveCourseValue(linha),
        resolveSemesterValue(linha) || '—',
        resolveShiftValue(linha) || '—',
        linha.ra || linha.Ra || '—',
        linha.userName || linha.name || linha.nome || '—',
        resolveEntryMethod(linha),
        resolvePhotoLinked(linha),
        resolveExitMethod(linha),
        entrada ? new Date(entrada).toLocaleString('pt-BR') : '—',
        saida   ? new Date(saida).toLocaleString('pt-BR')   : '—',
        String(permanencia),
        valido ? 'Válido' : 'Inválido',
        String(pontosFinais),
      ];
    });

    autoTable(doc, {
      startY: 35,
      head: [['Curso', 'Sem.', 'Turno', 'RA', 'Participante', 'Método entrada', 'Foto', 'Método saída', 'Entrada', 'Saída', 'Perm. (min)', 'Status', 'Pontos']],
      body: linhas,
      headStyles: { fillColor: [196, 30, 58], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [255, 245, 245] },
      didDrawCell: (data) => {
        // Colorir coluna Status
        if (data.section === 'body' && data.column.index === 11) {
          const isValido = data.cell.raw === 'Válido';
          doc.setTextColor(isValido ? 40 : 180, isValido ? 167 : 30, isValido ? 69 : 30);
          doc.text(data.cell.raw, data.cell.x + 2, data.cell.y + data.cell.height / 2 + 1, { baseline: 'middle' });
          doc.setTextColor(0);
        }
      },
    });

    const filtros = [
      cursoSelecionado    !== 'TODOS' ? `Curso: ${cursoSelecionado}`       : null,
      semestreSelecionado !== 'TODOS' ? `Semestre: ${semestreSelecionado}` : null,
      turnoSelecionado    !== 'TODOS' ? `Turno: ${turnoSelecionado}`       : null,
    ].filter(Boolean);

    if (filtros.length > 0) {
      const finalY = doc.lastAutoTable.finalY + 6;
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Filtros aplicados: ${filtros.join(' | ')}`, 14, finalY);
    }

    const nomeArquivo = `relatorio_${nomeEvento.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(nomeArquivo);
  };

  const handleExportPDFConsolidado = () => {
    if (!consolidado) return;
    const { Eventos: evs, Alunos: alunos } = consolidado;
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(16);
    doc.setTextColor(196, 30, 58);
    doc.text('Relatório Consolidado de Pontuações', 14, 16);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 23);
    doc.text(`Total de alunos: ${alunos.length}`, 14, 29);

    const cabecalho = ['RA', 'Nome', 'Curso', 'Sem.', 'Turno',
      ...evs.map((ev) => `${ev.nomeEvento || ev.NomeEvento}\n(${ev.data || ev.Data})`),
      'TOTAL',
    ];

    const linhas = alunos.map((a) => {
      const porEvento = (a.pontosPorEvento || a.PontosPorEvento || []).map((p) =>
        String(p.pontos ?? p.Pontos ?? 0)
      );
      return [
        a.ra || a.Ra || '—',
        a.nome || a.Nome || '—',
        a.curso || a.Curso || '—',
        a.semestre || a.Semestre || '—',
        a.turno || a.Turno || '—',
        ...porEvento,
        String(a.totalPontos ?? a.TotalPontos ?? 0),
      ];
    });

    autoTable(doc, {
      startY: 35,
      head: [cabecalho],
      body: linhas,
      headStyles: { fillColor: [196, 30, 58], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [255, 245, 245] },
      columnStyles: { [cabecalho.length - 1]: { fontStyle: 'bold' } },
    });

    doc.save(`relatorio_consolidado_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <>
      <h2 style={{ color: '#c41e3a', marginBottom: '20px', fontSize: '26px' }}>
        Relatórios
      </h2>

      {/* Abas */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #c41e3a' }}>
        {[
          { key: 'porEvento',    label: 'Por Evento (check-ins)' },
          { key: 'consolidado',  label: 'Consolidado (3 dias)' },
        ].map((aba) => (
          <button
            key={aba.key}
            onClick={() => setAbaAtiva(aba.key)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderBottom: abaAtiva === aba.key ? '3px solid #c41e3a' : '3px solid transparent',
              background: 'none',
              fontWeight: abaAtiva === aba.key ? 'bold' : 'normal',
              color: abaAtiva === aba.key ? '#c41e3a' : '#555',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {aba.label}
          </button>
        ))}
      </div>

      {/* ─── ABA: POR EVENTO ─── */}
      {abaAtiva === 'porEvento' && (
        <>
          <div className="card" style={{ padding: '20px' }}>
            <label style={{ fontWeight: 'bold', marginRight: '12px', color: '#555' }}>Evento:</label>
            <select
              value={eventoSelecionado}
              onChange={e => setEventoSelecionado(Number(e.target.value))}
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', width: '320px' }}
            >
              {eventos.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name || ev.nomeEvento || `Evento ${ev.id}`}</option>
              ))}
            </select>

            <div style={{ marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>Curso:</label>
                <select
              value={cursoSelecionado}
              onChange={(e) => setCursoSelecionado(e.target.value)}
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', width: '320px' }}
            >
              <option value="TODOS">Todos</option>
              {CURSOS.map((curso) => (
                <option key={curso} value={curso}>{curso}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>Semestre:</label>
            <select
              value={semestreSelecionado}
              onChange={(e) => setSemestreSelecionado(e.target.value)}
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', width: '140px' }}
            >
              <option value="TODOS">Todos</option>
              {SEMESTRES.map((sem) => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>Turno:</label>
            <select
              value={turnoSelecionado}
              onChange={(e) => setTurnoSelecionado(e.target.value)}
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', width: '180px' }}
            >
              <option value="TODOS">Todos</option>
              {TURNOS.map((turno) => (
                <option key={turno} value={turno}>{turno}</option>
              ))}
            </select>
          </div>
        </div>

        <p style={{ marginTop: '12px', color: '#666', fontSize: '14px' }}>
          {regraConfigurada
            ? `Regra ativa: permanência mínima de ${regra.minimumStayMinutes} min e pontos base ${regra.scoreValue}.`
            : 'Regra do evento não configurada.'}
        </p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ color: '#c41e3a', margin: 0 }}>Resultados por Curso</h3>
          {dadosFiltrados.length > 0 && (
            <button
              onClick={handleExportPDF}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              ⬇ Baixar PDF
            </button>
          )}
        </div>

        {loading && (
          <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>Carregando relatório...</p>
        )}

        {!loading && erro && (
          <p style={{ textAlign: 'center', color: '#c41e3a', padding: '20px' }}>{erro}</p>
        )}

        {!loading && !erro && dados.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>Nenhum registro encontrado para este evento.</p>
        )}

        {!loading && !erro && dados.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #c41e3a' }}>
                  {['Curso', 'Semestre', 'Turno', 'RA', 'Participante', 'Método entrada', 'Foto vinculada', 'Método saída', 'Entrada', 'Saída', 'Permanência (min)', 'Status', 'Pontos finais'].map(h => (
                    <th key={h} style={{ padding: '10px 8px', color: '#c41e3a', fontWeight: 'bold' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dadosFiltrados.map((linha, idx) => {
                  const permanencia = toNumber(
                    linha.stayMinutes ?? linha.tempoPermanenciaMinutos ?? linha.TempoPermanenciaMinutos ?? linha.permanenciaMinutos ?? linha.durationMinutes ?? linha.duration,
                    0
                  );
                  const minimo = toNumber(linha.minimumStayMinutes ?? linha.tempoMinimoMinutos ?? regra.minimumStayMinutes, 0);
                  const validoApi = resolveValidValue(linha);
                  const valido = typeof validoApi === 'boolean' ? validoApi : (minimo > 0 ? permanencia >= minimo : true);
                  const pontosBase = toNumber(linha.scoreValue ?? linha.pontuacao ?? linha.Pontuacao ?? regra.scoreValue, 0);
                  const pontosFinalApi = linha.finalScore ?? linha.pontosFinais ?? linha.totalPoints;
                  const pontosFinais = (pontosFinalApi != null && Number.isFinite(Number(pontosFinalApi)))
                    ? Number(pontosFinalApi)
                    : (valido ? pontosBase : 0);

                  const entrada = resolveDateValue(linha, ['entryTime', 'checkInAt', 'entryAt', 'entradaEm', 'checkIn', 'HorarioEntrada', 'horarioEntrada']);
                  const saida = resolveDateValue(linha, ['exitTime', 'checkOutAt', 'exitAt', 'saidaEm', 'checkOut', 'HorarioSaida', 'horarioSaida']);
                  const curso = resolveCourseValue(linha);
                  const semestre = resolveSemesterValue(linha) || '—';
                  const turno = resolveShiftValue(linha) || '—';
                  const metodoEntrada = resolveEntryMethod(linha);
                  const metodoSaida = resolveExitMethod(linha);
                  const fotoVinculada = resolvePhotoLinked(linha);

                  return (
                    <tr key={linha.id || idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px 8px' }}>{curso}</td>
                      <td style={{ padding: '12px 8px' }}>{semestre}</td>
                      <td style={{ padding: '12px 8px' }}>{turno}</td>
                      <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: '13px' }}>{linha.ra || linha.Ra || '—'}</td>
                      <td style={{ padding: '12px 8px' }}>{linha.userName || linha.name || linha.nome || '—'}</td>
                      <td style={{ padding: '12px 8px' }}>{metodoEntrada}</td>
                      <td style={{ padding: '12px 8px' }}>{fotoVinculada}</td>
                      <td style={{ padding: '12px 8px' }}>{metodoSaida}</td>
                      <td style={{ padding: '12px 8px', fontSize: '13px' }}>
                        {entrada ? new Date(entrada).toLocaleString('pt-BR') : '—'}
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '13px' }}>
                        {saida ? new Date(saida).toLocaleString('pt-BR') : '—'}
                      </td>
                      <td style={{ padding: '12px 8px' }}>{permanencia}</td>
                      <td style={{ padding: '12px 8px', color: valido ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                        {valido ? 'Valido' : 'Invalido'}
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{pontosFinais}</td>
                    </tr>
                  );
                })}
                {dadosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="13" style={{ textAlign: 'center', color: '#888', padding: '18px' }}>
                      Nenhum resultado para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>)} {/* fim aba porEvento */}

      {/* ─── ABA: CONSOLIDADO ─── */}
      {abaAtiva === 'consolidado' && (
        <>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ color: '#c41e3a', marginBottom: '14px' }}>Selecione os eventos dos 3 dias</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              {eventos.map((ev) => (
                <label key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                  padding: '8px 14px', border: `2px solid ${eventosSelecionados.includes(ev.id) ? '#c41e3a' : '#ddd'}`,
                  borderRadius: '8px', background: eventosSelecionados.includes(ev.id) ? '#fff5f5' : '#fafafa', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={eventosSelecionados.includes(ev.id)}
                    onChange={() => toggleEvento(ev.id)}
                  />
                  {ev.name || ev.nomeEvento || `Evento ${ev.id}`}
                  {(ev.data || ev.date) && (
                    <span style={{ color: '#888', fontSize: '12px' }}>
                      {new Date((ev.data || ev.date)).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </label>
              ))}
            </div>
            <button
              className="btn"
              onClick={handleCarregarConsolidado}
              disabled={loadingConsolidado || eventosSelecionados.length === 0}
            >
              {loadingConsolidado ? 'Carregando...' : 'Gerar relatório consolidado'}
            </button>
            {erroConsolidado && <p style={{ color: '#c41e3a', marginTop: '10px' }}>{erroConsolidado}</p>}
          </div>

          {consolidado && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ color: '#c41e3a', margin: 0 }}>
                  Pontuações consolidadas — {consolidado.totalAlunos ?? consolidado.TotalAlunos ?? 0} aluno(s)
                </h3>
                <button onClick={handleExportPDFConsolidado} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ⬇ Baixar PDF
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #c41e3a' }}>
                      <th style={{ padding: '10px 8px', color: '#c41e3a' }}>RA</th>
                      <th style={{ padding: '10px 8px', color: '#c41e3a' }}>Nome</th>
                      <th style={{ padding: '10px 8px', color: '#c41e3a' }}>Curso</th>
                      <th style={{ padding: '10px 8px', color: '#c41e3a' }}>Sem.</th>
                      <th style={{ padding: '10px 8px', color: '#c41e3a' }}>Turno</th>
                      {(consolidado.eventos || consolidado.Eventos || []).map((ev) => (
                        <th key={ev.id || ev.Id} style={{ padding: '10px 8px', color: '#c41e3a', textAlign: 'center' }}>
                          {ev.nomeEvento || ev.NomeEvento}<br />
                          <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#888' }}>
                            {ev.data || ev.Data}
                          </span>
                        </th>
                      ))}
                      <th style={{ padding: '10px 8px', color: '#c41e3a', textAlign: 'center', background: '#fff5f5' }}>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(consolidado.alunos || consolidado.Alunos || []).map((aluno, idx) => {
                      const pontosPorEvento = aluno.pontosPorEvento || aluno.PontosPorEvento || [];
                      const total = aluno.totalPontos ?? aluno.TotalPontos ?? 0;
                      return (
                        <tr key={aluno.ra || aluno.Ra || idx} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '10px 8px', fontSize: '13px' }}>{aluno.ra || aluno.Ra}</td>
                          <td style={{ padding: '10px 8px' }}>{aluno.nome || aluno.Nome}</td>
                          <td style={{ padding: '10px 8px', fontSize: '13px' }}>{aluno.curso || aluno.Curso}</td>
                          <td style={{ padding: '10px 8px', fontSize: '13px' }}>{aluno.semestre || aluno.Semestre || '—'}</td>
                          <td style={{ padding: '10px 8px', fontSize: '13px' }}>{aluno.turno || aluno.Turno || '—'}</td>
                          {pontosPorEvento.map((p, i) => (
                            <td key={i} style={{ padding: '10px 8px', textAlign: 'center',
                              color: (p.pontos ?? p.Pontos ?? 0) > 0 ? '#28a745' : '#888', fontWeight: 'bold' }}>
                              {p.pontos ?? p.Pontos ?? 0}
                            </td>
                          ))}
                          <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold',
                            fontSize: '15px', color: '#c41e3a', background: '#fff5f5' }}>
                            {total}
                          </td>
                        </tr>
                      );
                    })}
                    {(consolidado.alunos || consolidado.Alunos || []).length === 0 && (
                      <tr>
                        <td colSpan="99" style={{ textAlign: 'center', color: '#888', padding: '18px' }}>
                          Nenhum aluno pontuou nos eventos selecionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )} {/* fim aba consolidado */}
    </>
  );
}
