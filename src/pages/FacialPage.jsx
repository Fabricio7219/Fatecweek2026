import { useRef, useState, useEffect } from 'react';
import { facialService } from '../services/facialService';
import { eventService } from '../services/eventService';
import { inferirCurso, inferirUnidade, limparRA, formatarRA } from '../utils/raUtils';

export default function FacialPage() {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [mensagem, setMensagem] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [sucesso,  setSucesso]  = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraInfo, setCameraInfo] = useState('');
  const [raEntrada, setRaEntrada] = useState('');
  const [raSaida, setRaSaida] = useState('');
  const [eventos, setEventos] = useState([]);
  const [eventoSelecionado, setEventoSelecionado] = useState('');
  const [cursoEntrada, setCursoEntrada]   = useState('');
  const [unidadeEntrada, setUnidadeEntrada] = useState('');
  const [raValido, setRaValido]             = useState(false);
  const [entryMethod, setEntryMethod] = useState('scanner');
  const [refusedPhoto, setRefusedPhoto] = useState(false);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  };

  const getCameraErrorMessage = (error) => {
    const name = error?.name || '';
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return 'Permissão da câmera negada. Libere o acesso no navegador e clique em "Ativar câmera".';
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return 'Nenhuma câmera foi encontrada neste dispositivo.';
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return 'A câmera está em uso por outro aplicativo. Feche o app que está usando a câmera e tente novamente.';
    }
    if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
      return 'Não foi possível atender às configurações da câmera. Tente novamente em "Ativar câmera".';
    }
    return 'Erro ao acessar a câmera. Verifique as permissões do navegador.';
  };

  const collectCameraInfo = async () => {
    const infos = [];

    if (!window.isSecureContext) {
      infos.push('Contexto inseguro: abra em localhost ou https');
    } else {
      infos.push('Contexto seguro: ok');
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      infos.push('getUserMedia indisponível');
      setCameraInfo(infos.join(' | '));
      return [];
    }

    let videoDevices = [];
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      videoDevices = devices.filter((d) => d.kind === 'videoinput');
      infos.push(`Câmeras detectadas: ${videoDevices.length}`);
    } catch {
      infos.push('Falha ao listar dispositivos');
    }

    if (navigator.permissions?.query) {
      try {
        const permission = await navigator.permissions.query({ name: 'camera' });
        infos.push(`Permissão: ${permission.state}`);
      } catch {
        infos.push('Permissão: não suportado');
      }
    }

    setCameraInfo(infos.join(' | '));
    return videoDevices;
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMensagem('Seu navegador não suporta acesso à câmera (getUserMedia).');
      setSucesso(false);
      setCameraReady(false);
      return;
    }

    setMensagem('');
    setSucesso(false);

    try {
      stopCamera();

      const videoDevices = await collectCameraInfo();

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
            deviceId: videoDevices[0]?.deviceId ? { ideal: videoDevices[0].deviceId } : undefined,
          },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }

      setCameraReady(true);
      setMensagem('Câmera pronta para uso.');
      setSucesso(true);
    } catch (error) {
      setCameraReady(false);
      setCameraInfo((prev) => `${prev}${prev ? ' | ' : ''}Erro: ${error?.name || 'desconhecido'}`);
      setMensagem(getCameraErrorMessage(error));
      setSucesso(false);
    }
  };

  // Inicia câmera ao montar a tela
  useEffect(() => {
    startCamera();

    // Desliga a câmera ao desmontar
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    async function carregarEventos() {
      try {
        const lista = await eventService.list();
        setEventos(Array.isArray(lista) ? lista : []);
        if (Array.isArray(lista) && lista.length > 0) {
          setEventoSelecionado(String(lista[0].id));
        }
      } catch {
        setEventos([]);
      }
    }

    carregarEventos();
  }, []);

  const handleIdentificar = () => {
    if (!cameraReady || !videoRef.current?.videoWidth || !videoRef.current?.videoHeight) {
      setMensagem('A câmera ainda não está pronta. Clique em "Ativar câmera" e tente novamente.');
      setSucesso(false);
      return;
    }

    setLoading(true);
    setMensagem('');
    setSucesso(false);

    const canvas = canvasRef.current;
    const video  = videoRef.current;

    // Captura frame atual do vídeo
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    // Converte para blob e envia ao serviço
    // O facialService valida 100x100 mínimo e converte para base64 antes de enviar
    canvas.toBlob(async (blob) => {
      try {
        const resultado = await facialService.identify(blob);
        // Resposta: { success, userId, confidence, name }
        const confianca = (resultado.confidence * 100).toFixed(1);
        setMensagem(`Identificado: ${resultado.name} — Confiança: ${confianca}%`);
        setSucesso(true);
      } catch (error) {
        setMensagem(`Falha na identificação: ${error.message}`);
        setSucesso(false);
      } finally {
        setLoading(false);
      }
    }, 'image/jpeg');
  };

  const capturePhotoBlob = () => new Promise((resolve) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!video?.videoWidth || !video?.videoHeight) {
      resolve(null);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg');
  });

  const handleBuscarAlunoPorRa = async () => {
    if (!raEntrada.trim()) {
      setMensagem('Informe o RA para busca.');
      setSucesso(false);
      return;
    }

    setLoading(true);
    setMensagem('');
    try {
      const aluno = await facialService.lookupByRa(raEntrada.trim());
      const nome = aluno?.nomeCompleto || aluno?.NomeCompleto || aluno?.name || aluno?.fullName || aluno?.userName || 'Aluno identificado';
      const curso = aluno?.curso || aluno?.Curso || aluno?.course || aluno?.courseName || inferirCurso(raEntrada.trim());
      setCursoEntrada(curso);
      setUnidadeEntrada(inferirUnidade(raEntrada.trim()));
      setMensagem(`RA validado: ${nome} — ${curso}`);
      setSucesso(true);
    } catch {
      const curso = inferirCurso(raEntrada.trim());
      setCursoEntrada(curso);
      setUnidadeEntrada(inferirUnidade(raEntrada.trim()));
      setMensagem(`RA informado. Curso inferido: ${curso}.`);
      setSucesso(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarEntrada = async () => {
    if (!raEntrada.trim()) {
      setMensagem('Informe o RA do aluno para registrar entrada.');
      setSucesso(false);
      return;
    }
    if (!eventoSelecionado) {
      setMensagem('Selecione um evento para registrar entrada.');
      setSucesso(false);
      return;
    }

    setLoading(true);
    setMensagem('');
    setSucesso(false);

    try {
      const ra = raEntrada.trim();
      const curso = cursoEntrada || inferirCurso(ra);
      let payload = {
        ra,
        eventoId: Number(eventoSelecionado),
        course: curso,
        entryMethod,
        photoLinked: !refusedPhoto,
        refusedPhoto,
      };

      if (!refusedPhoto) {
        const blob = await capturePhotoBlob();
        if (!blob) {
          throw new Error('Não foi possível capturar a foto. Ative a câmera antes de registrar a entrada.');
        }
        payload = {
          ...payload,
          photoBlob: blob,
        };
      }

      await facialService.registerEntry(payload);
      setMensagem(refusedPhoto
        ? 'Entrada manual registrada (sem foto, por recusa do aluno).'
        : 'Entrada registrada com foto vinculada.');
      setSucesso(true);
    } catch (error) {
      setMensagem(`Falha ao registrar entrada: ${error.message}`);
      setSucesso(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarSaidaPorFoto = async () => {
    if (!eventoSelecionado) {
      setMensagem('Selecione um evento para registrar saída.');
      setSucesso(false);
      return;
    }

    setLoading(true);
    setMensagem('');
    setSucesso(false);
    try {
      let raDetectado = raSaida.trim();

      if (!raDetectado) {
        const blob = await capturePhotoBlob();
        if (!blob) {
          throw new Error('Não foi possível capturar a foto. Ative a câmera ou informe RA para saída.');
        }

        try {
          const identify = await facialService.identify(blob);
          raDetectado = String(
            identify?.ra || identify?.RA || identify?.userId || ''
          ).trim();
        } catch {
          // Sem endpoint facial no backend atual: permite fallback para RA digitado.
        }
      }

      if (!raDetectado) {
        throw new Error('Nao foi possivel identificar RA por foto. Informe o RA e tente novamente.');
      }

      await facialService.registerExit({
        ra: raDetectado,
        eventoId: Number(eventoSelecionado),
        exitMethod: 'facial',
      });
      setMensagem(`Saída registrada por foto/RA: ${raDetectado}.`);
      setSucesso(true);
    } catch (error) {
      setMensagem(`Falha ao registrar saída por foto: ${error.message}`);
      setSucesso(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarSaidaManual = async () => {
    if (!raSaida.trim()) {
      setMensagem('Informe o RA para saída manual.');
      setSucesso(false);
      return;
    }
    if (!eventoSelecionado) {
      setMensagem('Selecione um evento para registrar saída manual.');
      setSucesso(false);
      return;
    }

    setLoading(true);
    setMensagem('');
    setSucesso(false);
    try {
      await facialService.registerExit({
        ra: raSaida.trim(),
        eventoId: Number(eventoSelecionado),
        exitMethod: 'manual',
      });
      setMensagem('Saída manual registrada com sucesso.');
      setSucesso(true);
    } catch (error) {
      setMensagem(`Falha ao registrar saída manual: ${error.message}`);
      setSucesso(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 style={{ color: '#c41e3a', marginBottom: '25px', fontSize: '26px' }}>
        Controle de Entrada e Saída — Mesário
      </h2>

      <div className="card" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        {/* Preview da câmera */}
        <div style={{ marginBottom: '20px' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              maxWidth: '480px',
              border: '3px solid #c41e3a',
              borderRadius: '12px',
              display: 'block',
              margin: '0 auto',
            }}
          />
          <div style={{ marginTop: '10px' }}>
            <button className="btn btn-secondary" onClick={startCamera} disabled={loading}>
              Ativar câmera
            </button>
          </div>
          {cameraInfo && !cameraReady && (
            <div style={{ marginTop: '8px', color: '#666', fontSize: '12px' }}>
              Diagnóstico: {cameraInfo}
            </div>
          )}
        </div>

        {/* Canvas oculto para processar o frame */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div style={{ textAlign: 'left', marginBottom: '12px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>
            Evento
          </label>
          <select
            value={eventoSelecionado}
            onChange={(e) => setEventoSelecionado(e.target.value)}
            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '8px', width: '100%' }}
          >
            {eventos.length === 0 && <option value="">Nenhum evento disponível</option>}
            {eventos.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.name || ev.nomeEvento || `Evento ${ev.id}`}</option>
            ))}
          </select>
        </div>

        <div style={{ textAlign: 'left', marginTop: '12px' }}>
          <h3 style={{ color: '#c41e3a', marginBottom: '10px' }}>Entrada do Aluno</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="RA do aluno"
              value={raEntrada}
              onChange={(e) => {
                const val = e.target.value;
                setRaEntrada(val);
                const { valido } = limparRA(val);
                setRaValido(valido);
                if (valido) {
                  setCursoEntrada(inferirCurso(val));
                  setUnidadeEntrada(inferirUnidade(val));
                } else {
                  setCursoEntrada('');
                  setUnidadeEntrada('');
                }
              }}
              maxLength={13}
              style={{ padding: '10px', border: `1px solid ${raEntrada.length > 0 ? (raValido ? '#28a745' : '#dc3545') : '#ddd'}`, borderRadius: '8px', flex: '1 1 220px' }}
            />
            <select
              value={entryMethod}
              onChange={(e) => setEntryMethod(e.target.value)}
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '8px', flex: '1 1 180px' }}
            >
              <option value="scanner">Scanner código de barras</option>
              <option value="manual">Digitação manual RA</option>
            </select>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <button className="btn btn-secondary" onClick={handleBuscarAlunoPorRa} disabled={loading} style={{ marginRight: '10px' }}>
              Validar RA
            </button>
            {raEntrada.length > 0 && !raValido && (
              <span style={{ color: '#dc3545', fontSize: '13px' }}>RA deve ter 13 dígitos numéricos ({limparRA(raEntrada).limpo.length}/13)</span>
            )}
            {raValido && cursoEntrada && (
              <div style={{ marginTop: '6px', fontSize: '13px', color: '#555' }}>
                <span><strong>Curso:</strong> {cursoEntrada}</span>
                {unidadeEntrada && <span style={{ marginLeft: '16px' }}><strong>Unidade:</strong> {unidadeEntrada}</span>}
                <span style={{ marginLeft: '16px' }}><strong>RA formatado:</strong> {formatarRA(raEntrada)}</span>
              </div>
            )}
          </div>

          <label style={{ display: 'block', marginBottom: '12px', color: '#555' }}>
            <input
              type="checkbox"
              checked={refusedPhoto}
              onChange={(e) => setRefusedPhoto(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Aluno recusou tirar foto (entrada manual sem biometria)
          </label>

          <button
            onClick={handleRegistrarEntrada}
            disabled={loading}
            className="btn"
            style={{ opacity: loading ? 0.75 : 1, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '20px' }}
          >
            {loading ? 'Registrando entrada...' : 'Registrar Entrada'}
          </button>
        </div>

        <div style={{ textAlign: 'left', marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
          <h3 style={{ color: '#c41e3a', marginBottom: '10px' }}>Saída do Aluno</h3>
          <div className="btn-container" style={{ margin: '0 0 12px', textAlign: 'left' }}>
            <button
              onClick={handleRegistrarSaidaPorFoto}
              disabled={loading}
              className="btn"
              style={{ opacity: loading ? 0.75 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Processando...' : 'Registrar Saída por Foto'}
            </button>
            <button
              onClick={handleIdentificar}
              disabled={loading}
              className="btn btn-secondary"
              style={{ marginLeft: '10px' }}
            >
              Testar Identificação Facial
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="RA para saída manual"
              value={raSaida}
              onChange={(e) => setRaSaida(e.target.value)}
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '8px', flex: '1 1 220px' }}
            />
            <button className="btn btn-secondary" onClick={handleRegistrarSaidaManual} disabled={loading}>
              Registrar Saída Manual
            </button>
          </div>
        </div>

        {/* Mensagem de resultado */}
        {mensagem && (
          <div style={{
            padding: '14px 20px',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 'bold',
            background: sucesso ? '#d4edda' : '#f8d7da',
            color:      sucesso ? '#155724' : '#721c24',
            border:     `1px solid ${sucesso ? '#c3e6cb' : '#f5c6cb'}`,
          }}>
            {mensagem}
          </div>
        )}
      </div>
    </>
  );
}
