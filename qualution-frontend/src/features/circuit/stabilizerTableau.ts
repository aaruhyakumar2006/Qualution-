/**
 * stabilizerTableau.ts
 *
 * Implements the Aaronson-Gottesman (2004) stabilizer tableau representation
 * for polynomial-time simulation of Clifford circuits:
 * O(N^2) gate evolution, ~O(N^3) full-register measurement (exponentially superior to 2^N).
 *
 * Matrix dimensions: (2n + 1) rows x (2n + 1) columns per n qubits:
 * - Rows 0 .. n-1: Destabilizer generators R_1 .. R_n
 * - Rows n .. 2n-1: Stabilizer generators R_{n+1} .. R_{2n}
 * - Row 2n: Scratch row for deterministic measurement evaluation
 * - Columns 0 .. n-1: X-part (x_ij)
 * - Columns n .. 2n-1: Z-part (z_ij)
 * - Column 2n: Phase bit r_i in {0, 1} representing (-1)^r_i
 *
 * High-Performance Vectorized Architecture:
 * - Backed by contiguous Uint8Array buffer with zero allocation in hot loops.
 * - Inlined g-function and combined single-pass rowsum for maximal CPU cache efficiency.
 * - Native SIMD copyWithin and fill for instant row transfers and resets.
 */

export class StabilizerTableau {
  public readonly numQubits: number;
  public readonly numRows: number;
  public readonly numCols: number;
  private readonly data: Uint8Array;

  constructor(numQubits: number) {
    if (numQubits < 1) {
      throw new Error(`StabilizerTableau requires at least 1 qubit, got ${numQubits}`);
    }
    this.numQubits = numQubits;
    this.numRows = 2 * numQubits + 1; // +1 scratch row for measurement
    this.numCols = 2 * numQubits + 1; // x-part (n) + z-part (n) + phase bit (1)
    this.data = new Uint8Array(this.numRows * this.numCols);

    this.resetToZeroState();
  }

  /**
   * Resets the tableau to the |0^n> computational basis state:
   * Destabilizers R_i = X_i (x_ii = 1, z_ij = 0, r_i = 0)
   * Stabilizers R_{n+i} = Z_i (x_ij = 0, z_{n+i, i} = 1, r_{n+i} = 0)
   */
  public resetToZeroState(): void {
    this.data.fill(0);
    const n = this.numQubits;
    const numCols = this.numCols;
    const data = this.data;

    for (let i = 0; i < n; i++) {
      // Destabilizer R_i = X_i: row i, col i
      data[i * numCols + i] = 1;
      // Stabilizer R_{n+i} = Z_i: row (n+i), col (n+i)
      data[(n + i) * numCols + n + i] = 1;
    }
  }

  /**
   * Creates an exact deep clone of the current tableau using high-speed TypedArray buffer copy.
   */
  public clone(): StabilizerTableau {
    const copy = new StabilizerTableau(this.numQubits);
    copy.data.set(this.data);
    return copy;
  }

  /**
   * Total allocated buffer size in bytes.
   */
  public get byteLength(): number {
    return this.data.byteLength;
  }

  // ── Matrix Indexing Helpers ──────────────────────────────────────────

  private getIdx(row: number, col: number): number {
    return row * this.numCols + col;
  }

  public getX(row: number, qubit: number): number {
    return this.data[row * this.numCols + qubit];
  }

  public setX(row: number, qubit: number, val: number): void {
    this.data[row * this.numCols + qubit] = val & 1;
  }

  public getZ(row: number, qubit: number): number {
    return this.data[row * this.numCols + this.numQubits + qubit];
  }

  public setZ(row: number, qubit: number, val: number): void {
    this.data[row * this.numCols + this.numQubits + qubit] = val & 1;
  }

  public getPhase(row: number): number {
    return this.data[row * this.numCols + 2 * this.numQubits];
  }

  public setPhase(row: number, val: number): void {
    this.data[row * this.numCols + 2 * this.numQubits] = val & 1;
  }

  // ── Pauli Arithmetic (Aaronson & Gottesman g-function & rowsum) ─────

  /**
   * The Aaronson-Gottesman g-function:
   * Returns exponent of i when multiplying single-qubit Pauli operators:
   * P1 * P2 = i^g * P3
   */
  public static g(x1: number, z1: number, x2: number, z2: number): number {
    if (x1 === 0 && z1 === 0) return 0;
    if (x1 === 1 && z1 === 1) return z2 - x2;
    if (x1 === 1 && z1 === 0) return z2 * (2 * x2 - 1);
    return x2 * (1 - 2 * z2);
  }

  /**
   * High-Performance Single-Pass Rowsum:
   * Multiplies Pauli operators: row h <- row h * row i.
   * Inlines g-function and fuses phase accumulation with XOR vector updates.
   */
  public rowsum(h: number, i: number): void {
    const n = this.numQubits;
    const numCols = this.numCols;
    const data = this.data;
    const offsetH = h * numCols;
    const offsetI = i * numCols;
    const phaseCol = 2 * n;

    let sum = (data[offsetH + phaseCol] << 1) + (data[offsetI + phaseCol] << 1);

    for (let j = 0; j < n; j++) {
      const idxH_X = offsetH + j;
      const idxH_Z = offsetH + n + j;
      const idxI_X = offsetI + j;
      const idxI_Z = offsetI + n + j;

      const x1 = data[idxH_X];
      const z1 = data[idxH_Z];
      const x2 = data[idxI_X];
      const z2 = data[idxI_Z];

      if (x1 === 1) {
        if (z1 === 1) {
          sum += z2 - x2;
        } else {
          sum += z2 * (2 * x2 - 1);
        }
      } else if (z1 === 1) {
        sum += x2 * (1 - 2 * z2);
      }

      data[idxH_X] ^= x2;
      data[idxH_Z] ^= z2;
    }

    const mod4 = ((sum % 4) + 4) % 4;
    data[offsetH + phaseCol] = mod4 === 2 ? 1 : (mod4 === 0 ? 0 : (mod4 >> 1) & 1);
  }

  // ── Clifford Gate Updates (O(N) per gate across 2N rows) ─────────────

  /**
   * Hadamard Gate H(a):
   * H X H = Z, H Z H = X, H Y H = -Y
   */
  public applyH(qubit: number): void {
    const totalRows = 2 * this.numQubits;
    const numCols = this.numCols;
    const data = this.data;
    const n = this.numQubits;
    const phaseCol = 2 * n;

    for (let i = 0; i < totalRows; i++) {
      const rowOffset = i * numCols;
      const x = data[rowOffset + qubit];
      const z = data[rowOffset + n + qubit];
      data[rowOffset + phaseCol] ^= (x & z);
      data[rowOffset + qubit] = z;
      data[rowOffset + n + qubit] = x;
    }
  }

  /**
   * Phase Gate S(a):
   * S X S^dagger = Y, S Z S^dagger = Z, S Y S^dagger = -X
   */
  public applyS(qubit: number): void {
    const totalRows = 2 * this.numQubits;
    const numCols = this.numCols;
    const data = this.data;
    const n = this.numQubits;
    const phaseCol = 2 * n;

    for (let i = 0; i < totalRows; i++) {
      const rowOffset = i * numCols;
      const x = data[rowOffset + qubit];
      const z = data[rowOffset + n + qubit];
      data[rowOffset + phaseCol] ^= (x & z);
      data[rowOffset + n + qubit] = z ^ x;
    }
  }

  /**
   * S-dagger Gate S^dagger(a):
   * S^dagger X S = -Y, S^dagger Z S = Z, S^dagger Y S = X
   */
  public applySdg(qubit: number): void {
    const totalRows = 2 * this.numQubits;
    const numCols = this.numCols;
    const data = this.data;
    const n = this.numQubits;
    const phaseCol = 2 * n;

    for (let i = 0; i < totalRows; i++) {
      const rowOffset = i * numCols;
      const x = data[rowOffset + qubit];
      const z = data[rowOffset + n + qubit];
      data[rowOffset + phaseCol] ^= (x & (1 ^ z));
      data[rowOffset + n + qubit] = z ^ x;
    }
  }

  /**
   * Pauli X Gate X(a):
   * X X X = X, X Z X = -Z, X Y X = -Y
   */
  public applyX(qubit: number): void {
    const totalRows = 2 * this.numQubits;
    const numCols = this.numCols;
    const data = this.data;
    const n = this.numQubits;
    const phaseCol = 2 * n;

    for (let i = 0; i < totalRows; i++) {
      const rowOffset = i * numCols;
      data[rowOffset + phaseCol] ^= data[rowOffset + n + qubit];
    }
  }

  /**
   * Pauli Y Gate Y(a):
   * Y X Y = -X, Y Z Y = -Z, Y Y Y = Y
   */
  public applyY(qubit: number): void {
    const totalRows = 2 * this.numQubits;
    const numCols = this.numCols;
    const data = this.data;
    const n = this.numQubits;
    const phaseCol = 2 * n;

    for (let i = 0; i < totalRows; i++) {
      const rowOffset = i * numCols;
      data[rowOffset + phaseCol] ^= (data[rowOffset + qubit] ^ data[rowOffset + n + qubit]);
    }
  }

  /**
   * Pauli Z Gate Z(a):
   * Z X Z = -X, Z Z Z = Z, Z Y Z = -Y
   */
  public applyZ(qubit: number): void {
    const totalRows = 2 * this.numQubits;
    const numCols = this.numCols;
    const data = this.data;
    const phaseCol = 2 * this.numQubits;

    for (let i = 0; i < totalRows; i++) {
      const rowOffset = i * numCols;
      data[rowOffset + phaseCol] ^= data[rowOffset + qubit];
    }
  }

  /**
   * CNOT Gate CX(control, target):
   * CX (X_c) CX = X_c X_t
   * CX (Z_t) CX = Z_c Z_t
   */
  public applyCNOT(control: number, target: number): void {
    const totalRows = 2 * this.numQubits;
    const numCols = this.numCols;
    const data = this.data;
    const n = this.numQubits;
    const phaseCol = 2 * n;

    for (let i = 0; i < totalRows; i++) {
      const rowOffset = i * numCols;
      const xc = data[rowOffset + control];
      const zt = data[rowOffset + n + target];
      const xt = data[rowOffset + target];
      const zc = data[rowOffset + n + control];

      const phaseDelta = xc & zt & (xt ^ zc ^ 1);
      data[rowOffset + phaseCol] ^= phaseDelta;
      data[rowOffset + target] ^= xc;
      data[rowOffset + n + control] ^= zt;
    }
  }

  /**
   * Controlled-Z Gate CZ(control, target):
   * CZ (X_c) CZ = X_c Z_t
   * CZ (X_t) CZ = Z_c X_t
   */
  public applyCZ(control: number, target: number): void {
    const totalRows = 2 * this.numQubits;
    const numCols = this.numCols;
    const data = this.data;
    const n = this.numQubits;
    const phaseCol = 2 * n;

    for (let i = 0; i < totalRows; i++) {
      const rowOffset = i * numCols;
      const xc = data[rowOffset + control];
      const xt = data[rowOffset + target];
      const zc = data[rowOffset + n + control];
      const zt = data[rowOffset + n + target];

      const phaseDelta = xc & xt & (zc ^ zt);
      data[rowOffset + phaseCol] ^= phaseDelta;
      data[rowOffset + n + control] ^= xt;
      data[rowOffset + n + target] ^= xc;
    }
  }

  /**
   * SWAP Gate SWAP(qubitA, qubitB):
   * Exchanges qubit wire indices across all generators.
   */
  public applySWAP(qubitA: number, qubitB: number): void {
    if (qubitA === qubitB) return;
    const totalRows = 2 * this.numQubits;
    const numCols = this.numCols;
    const data = this.data;
    const n = this.numQubits;

    for (let i = 0; i < totalRows; i++) {
      const rowOffset = i * numCols;
      const idxA_X = rowOffset + qubitA;
      const idxB_X = rowOffset + qubitB;
      const idxA_Z = rowOffset + n + qubitA;
      const idxB_Z = rowOffset + n + qubitB;

      const xa = data[idxA_X];
      data[idxA_X] = data[idxB_X];
      data[idxB_X] = xa;

      const za = data[idxA_Z];
      data[idxA_Z] = data[idxB_Z];
      data[idxB_Z] = za;
    }
  }

  // ── Measurement (Aaronson & Gottesman Section IV) ───────────────────

  /**
   * Measures qubit in the computational Z basis.
   * Returns the measurement outcome 0 or 1.
   *
   * Case 1: Random (exists p in [n, 2n-1] with x_pq = 1) -> 50/50 outcome.
   * Case 2: Deterministic (all x_pq = 0 for p in [n, 2n-1]) -> outcome fixed by stabilizers.
   */
  public measure(qubit: number, rng: () => number = Math.random): number {
    const n = this.numQubits;
    const numCols = this.numCols;
    const data = this.data;
    const phaseCol = 2 * n;
    let p = -1;

    // Check if any stabilizer generator anticommutes with Z_q (i.e. x_{p, qubit} == 1)
    for (let i = n; i < 2 * n; i++) {
      if (data[i * numCols + qubit] === 1) {
        p = i;
        break;
      }
    }

    // ── Case 1: Random Outcome (50/50) ─────────────────────────────────
    if (p !== -1) {
      // Eliminate x on this qubit from all other rows
      for (let i = 0; i < 2 * n; i++) {
        if (i !== p && data[i * numCols + qubit] === 1) {
          this.rowsum(i, p);
        }
      }

      // Copy row p to corresponding destabilizer row p - n via native memory copy
      const destOffset = (p - n) * numCols;
      const srcOffset = p * numCols;
      data.copyWithin(destOffset, srcOffset, srcOffset + numCols);

      // Choose random outcome 0 or 1 with 50/50 probability
      const outcome = rng() < 0.5 ? 0 : 1;

      // Replace stabilizer row p with single-qubit Z_qubit and chosen eigenvalue
      data.fill(0, srcOffset, srcOffset + numCols);
      data[srcOffset + n + qubit] = 1;
      data[srcOffset + phaseCol] = outcome;

      return outcome;
    }

    // ── Case 2: Deterministic Outcome ──────────────────────────────────
    // Clear scratch row (row 2n) via native SIMD fill
    const scratchOffset = 2 * n * numCols;
    data.fill(0, scratchOffset, scratchOffset + numCols);

    // Sum corresponding stabilizer rows for each destabilizer with x_iq == 1
    for (let i = 0; i < n; i++) {
      if (data[i * numCols + qubit] === 1) {
        this.rowsum(2 * n, i + n);
      }
    }

    // Deterministic outcome is the phase of the scratch row
    return data[scratchOffset + phaseCol];
  }
}
