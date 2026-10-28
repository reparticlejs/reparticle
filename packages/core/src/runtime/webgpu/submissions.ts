/**
 * Share an encoder across different emitters during a synchronous update batch.
 * Queue writes happen before submission, so an emitter must flush its previous
 * step before reusing its uniform buffer or spawn mask. Outside a batch, each
 * step submits immediately, preserving the standalone emitter API.
 */
export class SimulationSubmissions {
  private encoder: GPUCommandEncoder | null = null;
  private readonly pending = new Set<object>();
  private depth = 0;
  private immediate = false;

  public constructor(private readonly device: GPUDevice) {}

  /** Always submit completed work, including when a later emitter throws. */
  public batch(updates: () => void): void {
    this.depth++;
    try {
      updates();
    } finally {
      this.depth--;
      if (this.depth === 0) {
        this.flush();
        this.immediate = false;
      }
    }
  }

  /** Call before uploading any data that this step's commands will read. */
  public beginStep(emitter: object): void {
    if (this.pending.has(emitter)) {
      this.flush();
    }
    if (this.depth > 0 && !this.immediate) {
      this.pending.add(emitter);
    }
  }

  /** Create the encoder after uploads, matching the immediate submission path. */
  public getEncoder(): GPUCommandEncoder {
    this.encoder ??= this.device.createCommandEncoder({ label: 'reparticle steps' });
    return this.encoder;
  }

  /** Outside a batch, or after a callback exposes it, keep updates immediate. */
  public endStep(): void {
    if (this.depth === 0 || this.immediate) {
      this.flush();
    }
  }

  /**
   * User callbacks can update again and enqueue their own GPU reads. Once results
   * escape the batch, submit subsequent steps immediately until the scope ends.
   */
  public publish(): void {
    this.flush();
    if (this.depth > 0) {
      this.immediate = true;
    }
  }

  /** Submit before reusing upload storage or releasing GPU resources. */
  public flush(): void {
    const encoder = this.encoder;
    if (!encoder) {
      return;
    }
    this.encoder = null;
    this.pending.clear();
    this.device.queue.submit([encoder.finish()]);
  }
}
