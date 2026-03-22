# Raffero Proof Server

Servidor dedicado para generar ZK shuffle proofs. Corre en tu PC de escritorio y se expone a internet via Cloudflare Tunnel.

## Setup (una sola vez)

### 1. Instalar dependencias

```bash
cd proof-server
bash setup.sh
```

### 2. Instalar Cloudflare Tunnel (exponer a internet gratis)

```bash
# En WSL/Linux:
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared
```

### 3. Arrancar el proof server

```bash
cd proof-server
npm start
```

### 4. En otra terminal, exponer con Cloudflare Tunnel

```bash
cloudflared tunnel --url http://localhost:3001
```

Esto te da una URL pública como `https://abc123.trycloudflare.com`. Copia esa URL.

### 5. Configurar el frontend

En tu proyecto de Vercel, agrega la variable de entorno:

```
NEXT_PUBLIC_PROOF_SERVER_URL=https://abc123.trycloudflare.com
```

O en `.env.local` para desarrollo:

```
NEXT_PUBLIC_PROOF_SERVER_URL=https://abc123.trycloudflare.com
```

## Producción (mantener corriendo 24/7)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar el proof server
FRONTEND_URL=https://tu-dominio.vercel.app pm2 start server.mjs --name raffero-proofs

# Iniciar cloudflared como servicio (URL fija requiere cuenta Cloudflare gratis)
cloudflared tunnel --url http://localhost:3001

# Guardar procesos para auto-inicio
pm2 save
pm2 startup
```

## Verificar que funciona

```bash
curl https://tu-url.trycloudflare.com/api/health
# Debe retornar: {"status":"ok","timestamp":...}
```
