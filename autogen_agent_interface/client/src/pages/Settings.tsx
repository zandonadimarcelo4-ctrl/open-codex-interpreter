import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Mic, Volume2, CheckCircle, XCircle, AlertCircle, RefreshCw, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export default function Settings() {
  const [, setLocation] = useLocation();
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('default');
  const [microphonePermission, setMicrophonePermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [isTestingMicrophone, setIsTestingMicrophone] = useState(false);
  const [microphoneTestLevel, setMicrophoneTestLevel] = useState(0);
  const [testError, setTestError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar permissão de microfone
  const checkMicrophonePermission = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicrophonePermission('denied');
        return false;
      }

      // Tentar verificar permissão via API
      if ('permissions' in navigator && 'query' in navigator.permissions) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setMicrophonePermission(permissionStatus.state as 'granted' | 'denied' | 'prompt');
          
          // Listar dispositivos se permissão concedida
          if (permissionStatus.state === 'granted') {
            await loadAudioDevices();
          }
          
          return permissionStatus.state === 'granted';
        } catch (permErr) {
          console.warn('Não foi possível verificar permissão via API:', permErr);
        }
      }

      // Tentar acessar microfone para verificar permissão
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicrophonePermission('granted');
        stream.getTracks().forEach(track => track.stop());
        await loadAudioDevices();
        return true;
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setMicrophonePermission('denied');
        } else {
          setMicrophonePermission('prompt');
        }
        return false;
      }
    } catch (err) {
      console.error('Erro ao verificar permissão:', err);
      setMicrophonePermission('unknown');
      return false;
    }
  }, []);

  // Carregar dispositivos de áudio disponíveis
  const loadAudioDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microfone ${device.deviceId.substring(0, 8)}`,
          kind: device.kind,
        }));

      setAudioDevices(audioInputs);
      console.log('[Settings] Dispositivos de áudio carregados:', audioInputs);
    } catch (err) {
      console.error('Erro ao carregar dispositivos de áudio:', err);
    }
  }, []);

  // Solicitar permissão de microfone
  const requestMicrophonePermission = useCallback(async () => {
    try {
      setTestError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setTestError('API de mídia não suportada neste navegador.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophonePermission('granted');
      
      // Parar stream de teste
      stream.getTracks().forEach(track => track.stop());
      
      // Recarregar dispositivos
      await loadAudioDevices();
    } catch (err: any) {
      console.error('Erro ao solicitar permissão:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicrophonePermission('denied');
        if (err.message.includes('by system')) {
          setTestError('Microfone bloqueado pelo sistema operacional. Verifique as configurações de privacidade do Windows.');
        } else {
          setTestError('Permissão de microfone negada. Clique no ícone de cadeado na barra de endereços e permita o acesso.');
        }
      } else {
        setTestError(`Erro: ${err.message || err.name || 'Erro desconhecido'}`);
      }
    }
  }, [loadAudioDevices]);

  // Testar microfone
  const testMicrophone = useCallback(async () => {
    try {
      setIsTestingMicrophone(true);
      setTestError(null);
      setMicrophoneTestLevel(0);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setTestError('API de mídia não suportada neste navegador.');
        setIsTestingMicrophone(false);
        return;
      }

      const constraints: MediaStreamConstraints = {
        audio: selectedMicrophone === 'default' 
          ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          : { deviceId: { exact: selectedMicrophone }, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMicrophonePermission('granted');

      // Criar AudioContext para medir nível de áudio
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      analyser.fftSize = 256;
      microphone.connect(analyser);

      const updateLevel = () => {
        if (!isTestingMicrophone) {
          stream.getTracks().forEach(track => track.stop());
          audioContext.close();
          return;
        }

        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setMicrophoneTestLevel(Math.min(100, (average / 255) * 100));

        requestAnimationFrame(updateLevel);
      };

      updateLevel();

      // Parar teste após 5 segundos
      setTimeout(() => {
        setIsTestingMicrophone(false);
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        setMicrophoneTestLevel(0);
      }, 5000);

    } catch (err: any) {
      console.error('Erro ao testar microfone:', err);
      setIsTestingMicrophone(false);
      setMicrophoneTestLevel(0);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicrophonePermission('denied');
        if (err.message.includes('by system')) {
          setTestError('Microfone bloqueado pelo sistema operacional. Verifique as configurações de privacidade do Windows.');
        } else {
          setTestError('Permissão de microfone negada.');
        }
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setTestError('Nenhum microfone encontrado.');
      } else if (err.name === 'NotReadableError') {
        setTestError('Erro ao acessar o microfone. Pode estar sendo usado por outro aplicativo.');
      } else {
        setTestError(`Erro: ${err.message || err.name || 'Erro desconhecido'}`);
      }
    }
  }, [selectedMicrophone, isTestingMicrophone]);

  // Carregar configurações ao montar componente
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      await checkMicrophonePermission();
      setIsLoading(false);
    };
    loadSettings();
  }, [checkMicrophonePermission]);

  // Salvar dispositivo selecionado no localStorage
  useEffect(() => {
    if (selectedMicrophone && selectedMicrophone !== 'default') {
      localStorage.setItem('selectedMicrophone', selectedMicrophone);
    }
  }, [selectedMicrophone]);

  // Carregar dispositivo salvo do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('selectedMicrophone');
    if (saved && audioDevices.some(d => d.deviceId === saved)) {
      setSelectedMicrophone(saved);
    }
  }, [audioDevices]);

  const getPermissionStatusIcon = () => {
    switch (microphonePermission) {
      case 'granted':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'denied':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'prompt':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPermissionStatusText = () => {
    switch (microphonePermission) {
      case 'granted':
        return 'Permissão concedida';
      case 'denied':
        return 'Permissão negada';
      case 'prompt':
        return 'Aguardando permissão';
      default:
        return 'Status desconhecido';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/app')}
            className="hover:bg-card"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-foreground" />
            <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          </div>
        </div>

        {/* Configurações de Áudio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Configurações de Áudio
            </CardTitle>
            <CardDescription>
              Configure o microfone para usar Speech-to-Text (STT)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status de Permissão */}
            <div className="space-y-2">
              <Label>Status de Permissão</Label>
              <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                {getPermissionStatusIcon()}
                <span className="text-sm font-medium">{getPermissionStatusText()}</span>
                {microphonePermission === 'denied' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={requestMicrophonePermission}
                    className="ml-auto"
                  >
                    Solicitar Permissão
                  </Button>
                )}
                {microphonePermission === 'granted' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={checkMicrophonePermission}
                    className="ml-auto"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Seleção de Microfone */}
            {microphonePermission === 'granted' && (
              <div className="space-y-2">
                <Label htmlFor="microphone-select">Microfone</Label>
                <Select
                  value={selectedMicrophone}
                  onValueChange={setSelectedMicrophone}
                >
                  <SelectTrigger id="microphone-select">
                    <SelectValue placeholder="Selecione um microfone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Padrão (Sistema)</SelectItem>
                    {audioDevices.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {audioDevices.length === 0 
                    ? 'Nenhum dispositivo de áudio encontrado. Solicite permissão primeiro.'
                    : `${audioDevices.length} dispositivo(s) de áudio disponível(is)`
                  }
                </p>
              </div>
            )}

            {/* Teste de Microfone */}
            {microphonePermission === 'granted' && audioDevices.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label>Testar Microfone</Label>
                  <div className="space-y-3">
                    <Button
                      onClick={testMicrophone}
                      disabled={isTestingMicrophone}
                      variant={isTestingMicrophone ? "secondary" : "default"}
                      className="w-full"
                    >
                      {isTestingMicrophone ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Testando... (Fale no microfone)
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-2" />
                          Testar Microfone
                        </>
                      )}
                    </Button>
                    
                    {isTestingMicrophone && (
                      <div className="space-y-2">
                        <div className="h-4 bg-card rounded-full overflow-hidden border">
                          <div
                            className="h-full bg-green-500 transition-all duration-100"
                            style={{ width: `${microphoneTestLevel}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          Nível de áudio: {Math.round(microphoneTestLevel)}%
                        </p>
                      </div>
                    )}

                    {testError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-sm text-red-500">{testError}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Instruções de Troubleshooting */}
            {microphonePermission === 'denied' && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label>Como Resolver Problemas de Permissão</Label>
                  <div className="p-4 bg-card rounded-lg border space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">1. Permissão do Navegador</h4>
                      <p className="text-xs text-muted-foreground">
                        Clique no ícone de cadeado (🔒) na barra de endereços e selecione "Permitir" para Microfone.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2">2. Permissão do Windows</h4>
                      <p className="text-xs text-muted-foreground">
                        Se o problema persistir, verifique as configurações de privacidade do Windows:
                      </p>
                      <ul className="text-xs text-muted-foreground mt-1 ml-4 list-disc">
                        <li>Abra Configurações do Windows (Win + I)</li>
                        <li>Vá em Privacidade e Segurança → Microfone</li>
                        <li>Ative "Acesso ao microfone para este dispositivo"</li>
                        <li>Ative "Permitir que aplicativos acessem seu microfone"</li>
                        <li>Ative "Permitir que aplicativos da área de trabalho acessem seu microfone"</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2">3. Recarregar Página</h4>
                      <p className="text-xs text-muted-foreground">
                        Após alterar as permissões, recarregue a página (F5) para aplicar as mudanças.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Configurações de TTS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Text-to-Speech (TTS)
            </CardTitle>
            <CardDescription>
              Configure as opções de voz para respostas de áudio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="tts-enabled">Habilitar TTS</Label>
                <p className="text-xs text-muted-foreground">
                  Reproduzir respostas em voz (Jarvis Voice)
                </p>
              </div>
              <Switch id="tts-enabled" defaultChecked />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Voz</Label>
              <Select defaultValue="pt-BR">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="es-ES">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

