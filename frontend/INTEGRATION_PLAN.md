# Raffero — Plan de Integración: De Mocks a Producción

## 0. Estado Actual y Discrepancias Encontradas

### 0.1 Contrato (`src/Raffle.sol`) — VERSION VIEJA

El contrato en el repo es la **versión original pre-audit**. NO tiene los cambios descritos en `AUDIT_AND_CHANGES.md`:

| Feature | Contrato Actual | Contrato Requerido (Audit) |
|---------|----------------|---------------------------|
| Flujo de cierre | `closeAndSetWinner(raffleId, randomness)` | `commitShuffleSecret` → `drawWinner` → VRF callback → `finalizeRaffle` |
| Shuffle secret | No existe | `commitShuffleSecret(raffleId, secretHash)` |
| VRF | No existe (randomness manual) | Supra dVRF con callback |
| Finalize con proof | No existe | `finalizeRaffle(proof, 8 public inputs)` |
| Winner index | Se calcula en `closeAndSetWinner` | Se calcula en `finalizeRaffle` post-VRF |
| Domain separation | Solo en `_expectedRecipientBinding` (sin DOMAIN_BIND) | DOMAIN_BIND en recipient binding |
| Struct Raffle | Sin `shuffleSecretHash`, `vrfRandomness` | Con ambos campos |

**Acción requerida**: Actualizar `src/Raffle.sol` con los cambios del audit ANTES de deployar.

### 0.2 Circuitos — YA ACTUALIZADOS

Los circuitos Noir SÍ reflejan los cambios del audit:

- **`circuits/raffle/src/main.nr`** (claim circuit): Tiene domain separation con `DOMAIN_COMMIT`, `DOMAIN_NULL`, `DOMAIN_BIND`. 6 public inputs: `root`, `nullifier_hash`, `recipient_binding`, `raffle_id`, `winner_index`, `tree_depth`.

- **`circuits/shuffle/src/main.nr`** (shuffle circuit): Fisher-Yates hash-based con `DOMAIN_ENTRY`, `DOMAIN_SHUFFLE`, `DOMAIN_SECRET`, `DOMAIN_GP`. 8 public inputs. Entry hash decomposition fix incluido.

### 0.3 Frontend — Incompatibilidades Detectadas

| Componente Frontend | Estado | Problema |
|---------------------|--------|----------|
| `lib/contracts.ts` (ABI) | Parcialmente correcto | ABI coincide con contrato VIEJO. Falta `commitShuffleSecret`, `finalizeRaffle` nuevo, `supraCallback` |
| `lib/types.ts` (Raffle) | Incorrecto | Tiene campos `mode`, `visibility`, `title`, `endsAt`, `createdAt` que NO están on-chain |
| `lib/poseidon.ts` | Placeholder | Usa keccak256 como stand-in. DEBE ser Poseidon2 real idéntico a los circuitos |
| `lib/commitment.ts` | Lógica correcta, hash incorrecto | Usa poseidon2 placeholder, no el real |
| `lib/merkle.ts` | Lógica correcta, hash incorrecto | Mismo problema: necesita Poseidon2 real |
| `hooks/useCreateRaffle.ts` | Correcto para contrato viejo | Necesita actualización cuando el contrato cambie |
| `hooks/useDepositTicket.ts` | Funcional | Coincide con `depositTicket` que NO cambia |
| `hooks/useClaimPrize.ts` | Parcialmente correcto | pubSignals mapping necesita revisión vs circuito real |
| `store/useUserStore.ts` | OK | Almacena tickets en localStorage, concepto correcto |

### 0.4 Datos On-Chain vs Off-Chain

Según el paper y audit, esto es lo que vive en cada lugar:

**ON-CHAIN (contrato):**
- `raffleId` — identificador único
- `ticketPrice` — precio en wei
- `levels` — profundidad del Merkle tree
- `maxSize` — 2^levels
- `nextIndex` — contador de tickets
- `root` — Merkle root actual del pending tree
- `commitments[raffleId][index]` — commitment de cada ticket
- `nullifiers[raffleId][hash]` — nullifiers usados (anti double-claim)
- `prizePool` — AVAX acumulado
- `open` / `winnerSet` — estado del raffle
- `winnerIndex` — posición ganadora
- `shuffleSecretHash` — H(operator_secret) committeado (NUEVO)
- `vrfRandomness` — output del VRF (NUEVO)

**OFF-CHAIN (frontend/IPFS/backend):**
- `mode` — "roulette" | "duckrace" (cosmético)
- `visibility` — "public" | "hidden" | "private"
- `title` — nombre del raffle
- `endsAt` — timestamp de expiración
- Aliases de participantes
- PIN para raffles privados
- Secrets del usuario (localStorage encriptado)

---

## 1. Pre-requisitos: Compilar y Deployar

Antes de tocar el frontend, estos pasos deben completarse:

### 1.1 Actualizar el Contrato Solidity

Aplicar todos los cambios del `AUDIT_AND_CHANGES.md` a `src/Raffle.sol`:

- [ ] Agregar campos `shuffleSecretHash` y `vrfRandomness` al struct Raffle
- [ ] Agregar `commitShuffleSecret(raffleId, secretHash)`
- [ ] Modificar `drawWinner()` para requerir secret committeado y solicitar VRF
- [ ] Implementar `supraCallback()` que solo almacena `vrfRandomness`
- [ ] Reescribir `finalizeRaffle()` con 8 public inputs del shuffle circuit
- [ ] Calcular `winnerIndex` en `finalizeRaffle` (no en VRF callback)
- [ ] Actualizar `_expectedRecipientBinding()` con `DOMAIN_BIND` y `hash_3`
- [ ] Agregar `DOMAIN_BIND` como constante pública
- [ ] Agregar nuevos eventos y errores
- [ ] Actualizar `canDrawWinner()` con nuevos prerequisitos

### 1.2 Compilar Circuitos

```bash
cd circuits/raffle && nargo build
cd circuits/shuffle && nargo build
```

- [ ] Verificar que `nargo test` pasa para ambos circuitos
- [ ] Generar el verifier Solidity actualizado desde el circuito de claim: el `UltraVerifier.sol` actual puede no coincidir con el circuito actualizado
- [ ] Generar artifact JSON del circuito de claim para uso en el frontend con `@noir-lang/noir_js`

### 1.3 Compilar y Testear Contratos

```bash
forge build
forge test
```

- [ ] Escribir tests de integración para el nuevo flujo completo
- [ ] Verificar que los zero hashes del contrato coinciden con los del circuito

### 1.4 Deploy a Fuji Testnet

- [ ] Deploy `IPoseidon2` (o usar precompile si existe en Avalanche)
- [ ] Deploy `UltraVerifier.sol` (regenerado del circuito actualizado)
- [ ] Deploy `PrivateRaffle.sol` actualizado
- [ ] Obtener y registrar las 3 direcciones de contrato
- [ ] Configurar Supra dVRF en Fuji (si disponible) o usar mock VRF para testing

---

## 2. Integración Frontend — Paso a Paso

### Fase A: Actualizar Infraestructura Web3

#### A.1 Actualizar ABI del Contrato (`lib/contracts.ts`)

El ABI actual corresponde al contrato viejo. Actualizar con:

**Funciones nuevas a agregar:**
```typescript
// commitShuffleSecret(raffleId, secretHash)
{
  type: "function",
  name: "commitShuffleSecret",
  inputs: [
    { name: "raffleId", type: "uint256" },
    { name: "secretHash", type: "bytes32" },
  ],
  outputs: [],
  stateMutability: "nonpayable",
}

// supraCallback no se llama desde frontend
```

**Funciones a modificar:**
- `finalizeRaffle` — nuevo signature con 8 public inputs (este es para el operador/backend, no para usuarios normales)
- `raffles` view — retorna campos adicionales (`shuffleSecretHash`, `vrfRandomness`)

**Funciones que NO cambian:**
- `createRaffle(raffleId, ticketPrice, levels)` — igual
- `depositTicket(raffleId, commitment)` — igual
- `claimPrize(pA, pB, pC, pubSignals, recipient)` — signature igual, pero pubSignals debe coincidir con el nuevo circuito

**Evento nuevo:**
```typescript
{
  type: "event",
  name: "ShuffleSecretCommitted",
  inputs: [
    { name: "raffleId", type: "uint256", indexed: true },
    { name: "secretHash", type: "bytes32", indexed: false },
  ],
}
```

#### A.2 Actualizar Direcciones de Contratos (`lib/constants.ts`)

Reemplazar los `0x000...` con las direcciones reales post-deploy:

```typescript
export const RAFFLE_CONTRACT = "0x<real_address>" as `0x${string}`;
export const VERIFIER_CONTRACT = "0x<real_address>" as `0x${string}`;
export const POSEIDON_CONTRACT = "0x<real_address>" as `0x${string}`;
```

Considerar moverlas a `.env.local`:
```
NEXT_PUBLIC_RAFFLE_CONTRACT=0x...
NEXT_PUBLIC_VERIFIER_CONTRACT=0x...
NEXT_PUBLIC_POSEIDON_CONTRACT=0x...
```

#### A.3 Implementar Poseidon2 Real (`lib/poseidon.ts`)

**Opción A — Usar Poseidon2 del contrato on-chain:**
```typescript
async function poseidon2(a: bigint, b: bigint): Promise<bigint> {
  return await publicClient.readContract({
    address: POSEIDON_CONTRACT,
    abi: POSEIDON_ABI,
    functionName: "poseidon",
    args: [[a, b]],
  });
}
```

Ventaja: Garantiza 100% de compatibilidad con el contrato.
Desventaja: Requiere RPC call por cada hash (lento para Merkle trees).

**Opción B — Usar `@noir-lang/noir_js` Poseidon2:**
```typescript
import { Noir } from "@noir-lang/noir_js";
// Usar las primitivas de hash de Noir directamente
```

**Opción C — Usar librería JS de Poseidon2 compatible con BN254:**
Buscar una implementación JS/WASM de Poseidon2 que use los mismos parámetros que Noir.

**Recomendación**: Opción A para validaciones críticas (commitment al depositar ticket), Opción B/C para reconstrucción de Merkle trees locales donde se necesita velocidad.

#### A.4 Actualizar Tipos (`lib/types.ts`)

Separar claramente datos on-chain de off-chain:

```typescript
/** Datos que vienen del contrato */
interface OnChainRaffle {
  id: bigint;
  ticketPrice: bigint;
  levels: number;
  maxSize: number;
  nextIndex: number;
  root: bigint;
  open: boolean;
  winnerSet: boolean;
  winnerIndex: number;
  prizePool: bigint;
  shuffleSecretHash: string;     // NUEVO
  vrfRandomness: bigint;         // NUEVO
}

/** Metadata off-chain (localStorage, URL params, o futuro backend) */
interface RaffleMetadata {
  mode: RaffleMode;
  visibility: RaffleVisibility;
  title: string;
  endsAt: number;
  createdAt: number;
  pinHash?: string;
}

/** Raffle completo = on-chain + off-chain */
interface Raffle extends OnChainRaffle {
  metadata: RaffleMetadata;
}
```

#### A.5 Actualizar Commitment Generation (`lib/commitment.ts`)

Una vez que `poseidon.ts` usa Poseidon2 real:

```typescript
// commitment = Poseidon2([DOMAIN_COMMIT, secret, nullifier], 3)
async function generateCommitment(secret: bigint, nullifier: bigint): Promise<bigint> {
  return poseidon3(DOMAIN_COMMIT, secret, nullifier);
}
```

**CRÍTICO**: El commitment generado en el frontend DEBE coincidir exactamente con lo que el circuito de claim verifica. Si hay discrepancia, el usuario no podrá reclamar su premio.

**Test de validación**:
1. Generar commitment en JS
2. Generar el mismo commitment en `nargo test`
3. Verificar que son idénticos

---

### Fase B: Flujo de Usuario (Participante)

#### B.1 Join Raffle — Flujo Real

El flujo actual del frontend (`/raffle/[id]/join`) es conceptualmente correcto pero necesita:

1. **Generar secrets**: `secret = randomField()`, `nullifier = randomField()` ✅ (ya implementado)
2. **Computar commitment**: `commitment = Poseidon2([DOMAIN_COMMIT, secret, nullifier], 3)` ⚠️ (necesita Poseidon2 real)
3. **Enviar transacción**: `depositTicket(raffleId, commitment)` con `value = ticketPrice` ✅ (hook existe)
4. **Guardar secrets**: localStorage con `{ raffleId, secret, nullifier, alias, leafIndex, commitment }` ✅ (concepto correcto)
5. **Obtener leafIndex**: Del evento `TicketDeposited` en el receipt de la transacción ⚠️ (no implementado — actualmente hardcodeado a -1)

**Cambios necesarios en `app/raffle/[id]/join/page.tsx`:**
- Usar `useDepositTicket` hook real
- Parsear el evento `TicketDeposited` del receipt para obtener `leafIndex`
- Usar Poseidon2 real para commitment
- Manejar errores de transacción (user rejection, insufficient funds, raffle full, etc.)

#### B.2 Claim Prize — Flujo Real

El flujo de claim es el más complejo. El usuario necesita:

1. **Cargar secrets** de localStorage para el raffleId
2. **Obtener datos on-chain**: `winnerIndex`, `root` del final tree (post-shuffle)
3. **Reconstruir Merkle proof**: Necesita todos los commitments del final tree para construir el path
4. **Generar ZK proof** con el circuito de claim:

**Inputs privados:**
```
secret, nullifier, siblings[0..31], path_indices[0..31], recipient
```

**Inputs públicos:**
```
root (final tree), nullifier_hash, recipient_binding, raffle_id, winner_index, tree_depth
```

5. **Enviar transacción**: `claimPrize(pA, pB, pC, pubSignals, recipient)`

**Problema crítico**: El circuito de claim verifica membership en el **final tree** (post-shuffle), NO en el pending tree. El frontend necesita acceso a los commitments del final tree, que se construyen durante `finalizeRaffle`. Estos datos deben estar disponibles off-chain (IPFS, CDN, o backend del operador).

**Cambios necesarios:**
- `lib/noir.ts`: Cargar el artifact real del circuito compilado
- `hooks/useProofGeneration.ts`: Generar proof real con Barretenberg
- `hooks/useClaimPrize.ts`: Mapear pubSignals correctamente al ABI
- Obtener siblings del final tree (requiere servicio off-chain o indexer)

#### B.3 Mapeo de pubSignals para claimPrize

El contrato espera `uint[24] pubSignals`. El circuito tiene 6 public inputs, pero UltraPlonk/Honk puede expandirlos. Verificar el orden exacto después de compilar:

```
pubSignals[0] = nullifierHash
pubSignals[1] = recipientBinding
pubSignals[2] = root (final tree root)
pubSignals[3] = raffleId
pubSignals[4] = winnerIndex
pubSignals[5] = treeDepth
pubSignals[6..23] = padding/circuit-specific (verificar con el verifier generado)
```

**IMPORTANTE**: El orden depende de cómo Noir ordena los public inputs en la compilación. Verificar con `nargo info` o leyendo el artifact JSON.

---

### Fase C: Flujo de Operador (Admin)

El frontend actualmente NO tiene UI de operador. Se necesita un panel admin o al menos funciones para:

#### C.1 Crear Raffle (ya existe parcialmente)

```
createRaffle(raffleId, ticketPrice, levels)
```

- `raffleId`: Generar determinísticamente (hash de timestamp + creator + nonce)
- `levels`: Computar de `Math.ceil(Math.log2(maxParticipants))`
- Guardar metadata off-chain (mode, title, visibility, endsAt)

#### C.2 Commit Shuffle Secret (NUEVO)

```
commitShuffleSecret(raffleId, H(DOMAIN_SECRET, operatorSecret))
```

- Generar `operatorSecret = randomField()`
- Computar `secretHash = Poseidon2([DOMAIN_SECRET, operatorSecret], 2)`
- Guardar `operatorSecret` de forma segura (NO en localStorage del browser)
- Enviar transacción con `secretHash`

#### C.3 Draw Winner — Solicitar VRF (NUEVO)

```
drawWinner(raffleId)
```

- Requiere que secret ya esté committeado
- Solicita randomness al VRF de Supra
- El callback `supraCallback` se ejecuta automáticamente

#### C.4 Finalize Raffle — Generar y Enviar Shuffle Proof (NUEVO)

Este es el paso más pesado. Requiere:

1. Obtener todos los `TicketDeposited` events para reconstruir pending leaves
2. Obtener `vrfRandomness` del contrato
3. Ejecutar Fisher-Yates shuffle off-chain con el seed correcto
4. Generar ZK proof del shuffle circuit
5. Enviar `finalizeRaffle(proof, pubSignals)`

**Esto probablemente NO corre en el browser**. Para 256+ participantes, la generación de proof requiere un backend/server con hardware potente. El frontend del operador solo enviaría la transacción con el proof pre-generado.

---

### Fase D: Datos Off-Chain y Metadata

#### D.1 Almacenamiento de Metadata de Raffles

Opciones (de más simple a más robusto):

1. **URL params + localStorage** (MVP): El creador obtiene un link con metadata codificada. Usuarios que visitan el link guardan la metadata localmente.
   - Pro: Sin backend
   - Con: Se pierde si se borra localStorage, no discoverable

2. **IPFS**: Subir JSON con metadata, guardar CID on-chain o en el URL.
   - Pro: Descentralizado, persistente
   - Con: Necesita pinning service

3. **Backend simple** (recomendado para MVP funcional): API REST que almacena metadata indexada por `raffleId`.
   - Pro: Fiable, queryable, soporta Explore page
   - Con: Centralizado

#### D.2 Almacenamiento de Aliases Post-Shuffle

Para la animación de ruleta/duck race, el frontend necesita la lista de aliases en orden final (shuffled). Esto se obtiene del operador después de `finalizeRaffle`.

El paper sugiere: **alias_root on-chain** + **lista de aliases en CDN/IPFS** verificable contra el root.

#### D.3 Indexación de Eventos

Para reconstruir el estado de un raffle (lista de participantes, etc.), el frontend necesita leer eventos históricos:

```typescript
const events = await publicClient.getLogs({
  address: RAFFLE_CONTRACT,
  event: parseAbiItem("event TicketDeposited(uint256 indexed raffleId, uint256 index, uint256 commitment)"),
  args: { raffleId },
  fromBlock: raffleCreationBlock,
});
```

Esto funciona en Avalanche Fuji pero puede ser lento para raffles grandes. Un indexer (subgraph o backend) mejoraría el rendimiento.

---

## 3. Resumen de Archivos a Modificar/Crear

### Contratos (Pre-requisito)

| Archivo | Acción |
|---------|--------|
| `src/Raffle.sol` | Actualizar con cambios del audit |
| `src/UltraVerifier.sol` | Regenerar desde circuito compilado |

### Frontend — Modificar

| Archivo | Cambio |
|---------|--------|
| `lib/contracts.ts` | ABI actualizado post-deploy |
| `lib/constants.ts` | Direcciones reales |
| `lib/types.ts` | Separar OnChainRaffle vs RaffleMetadata |
| `lib/poseidon.ts` | Poseidon2 real (on-chain call o WASM) |
| `lib/commitment.ts` | Usar Poseidon2 real, validar vs circuito |
| `lib/merkle.ts` | Usar Poseidon2 real, zero values del contrato |
| `lib/noir.ts` | Cargar artifact real, generar proof real |
| `hooks/useRaffle.ts` | Leer struct actualizado, parsear nuevos campos |
| `hooks/useDepositTicket.ts` | Parsear evento TicketDeposited del receipt |
| `hooks/useClaimPrize.ts` | pubSignals mapping real |
| `hooks/useProofGeneration.ts` | Proof real con Barretenberg |
| `app/raffle/[id]/join/page.tsx` | Flujo real de deposit |
| `app/raffle/[id]/claim/page.tsx` | Flujo real de claim con proof |
| `app/raffle/[id]/page.tsx` | Leer estado real del contrato, quitar mocks |
| `app/explore/page.tsx` | Leer raffles reales (eventos o backend) |

### Frontend — Crear

| Archivo | Propósito |
|---------|-----------|
| `lib/events.ts` | Helpers para leer eventos on-chain (TicketDeposited, RaffleCreated, etc.) |
| `hooks/useRaffleEvents.ts` | Hook para escuchar eventos en real-time |
| `hooks/useCommitSecret.ts` | Hook para operador: commitShuffleSecret |
| `hooks/useDrawWinner.ts` | Hook para operador: drawWinner |
| `app/admin/page.tsx` | Panel de operador (commit, draw, finalize) |
| `lib/metadata.ts` | CRUD de metadata off-chain (localStorage MVP o API) |

---

## 4. Orden de Implementación Recomendado

### Etapa 1: Infraestructura (Bloqueante)
1. Actualizar `src/Raffle.sol` con cambios del audit
2. Compilar circuitos con `nargo build`
3. Regenerar `UltraVerifier.sol`
4. `forge build` + `forge test`
5. Deploy a Fuji: Poseidon2, Verifier, PrivateRaffle
6. Registrar direcciones en `.env.local`

### Etapa 2: Poseidon2 Real
7. Implementar `lib/poseidon.ts` con llamada on-chain al contrato Poseidon2
8. Validar que `generateCommitment()` produce el mismo resultado que `nargo test`
9. Actualizar `lib/merkle.ts` con zero values reales del contrato
10. Actualizar `lib/commitment.ts`

### Etapa 3: Flujo de Participante
11. Actualizar `lib/contracts.ts` con ABI real
12. Actualizar `lib/types.ts` con separación on-chain/off-chain
13. Actualizar `hooks/useRaffle.ts` para leer del contrato real
14. Actualizar `hooks/useDepositTicket.ts` para parsear events
15. Actualizar join page con flujo real
16. Implementar `lib/events.ts` para leer TicketDeposited

### Etapa 4: Flujo de Claim
17. Integrar `@noir-lang/noir_js` + `@noir-lang/backend_barretenberg` reales
18. Actualizar `lib/noir.ts` para cargar artifact compilado
19. Actualizar `hooks/useProofGeneration.ts` con proof real
20. Actualizar `hooks/useClaimPrize.ts` con pubSignals mapping verificado
21. Actualizar claim page

### Etapa 5: Flujo de Operador
22. Crear hooks de operador (commitSecret, drawWinner)
23. Crear panel admin
24. Implementar finalizeRaffle (probablemente como script de backend, no UI)

### Etapa 6: Metadata y Discovery
25. Implementar almacenamiento de metadata (localStorage MVP)
26. Actualizar Explore page para leer raffles reales (eventos on-chain)
27. Implementar alias list distribution post-shuffle

---

## 5. Datos Públicos vs Privados — Referencia Rápida

### Públicos (visibles on-chain o en la UI)
- `raffleId`, `ticketPrice`, `levels`, `maxSize`
- `prizePool`, `nextIndex` (cuántos tickets vendidos)
- `root` (Merkle root — no revela contenido)
- `winnerIndex` (posición ganadora en final tree)
- `nullifierHash` (al hacer claim — no revela identidad)
- `aliases` en orden shuffled (para la animación)
- `shuffleSecretHash` (hash del secret, no el secret)
- `vrfRandomness` (output del VRF)

### Privados (NUNCA salen del dispositivo del usuario)
- `secret` — random field element del usuario
- `nullifier` — random field element del usuario
- `commitment = H(DOMAIN_COMMIT, secret, nullifier)` — el valor es público, pero la pre-imagen es privada
- La asociación `wallet address ↔ alias` — protegida por el shuffle
- La asociación `wallet address ↔ commitment` — protegida por el shuffle
- `operatorSecret` — privado del operador (permite reconstruir la permutación)

### Semi-privados (observables pero no vinculables)
- Qué wallet compró un ticket (observable en la blockchain)
- El commitment que esa wallet depositó (observable)
- Pero después del shuffle, nadie puede vincular el commitment a una posición en el final tree (excepto el operador)

---

## 6. Riesgos y Consideraciones

### 6.1 Poseidon2 Compatibility
El riesgo #1 es que el Poseidon2 del frontend no coincida con el de los circuitos/contrato. Si los parámetros internos (MDS matrix, round constants, etc.) difieren, los commitments generados en el frontend serán inválidos y los usuarios no podrán reclamar premios.

**Mitigación**: Usar la misma implementación (llamada on-chain al contrato Poseidon2, o la librería WASM de Noir) y validar con tests cruzados.

### 6.2 Proof Generation en Browser
Generar proofs ZK en el browser es lento (10-30 segundos para el circuito de claim). Considerar:
- Web Worker para no bloquear UI
- Progress feedback al usuario
- Opción de relayer que genera el proof por el usuario (sacrifica algo de privacidad)

### 6.3 Secret Recovery
Si el usuario pierde sus secrets (borra localStorage), pierde la capacidad de reclamar. Implementar:
- Descarga de backup file al momento de join
- Warning prominente
- Opcionalmente: encriptar secrets con firma de wallet (recuperables si tiene la wallet)

### 6.4 Supra dVRF en Fuji
Verificar que Supra dVRF está disponible en Avalanche Fuji testnet. Si no, usar un mock VRF para desarrollo y testing.
