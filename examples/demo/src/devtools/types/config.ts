/** Explicit display and panel settings after project configuration shorthand is resolved. */
export interface StatsConfig {
  /** Expanded shows all panels; compact presents one panel at a time. */
  readonly display: 'expanded' | 'compact';
  readonly fps: boolean;
  readonly frameInterval: boolean;
  /** Approximate browser-reported JavaScript heap, when supported. */
  readonly jsHeap: boolean;
  /** Submitted WebGL draw operations per frame; instances are not separate draws. */
  readonly drawCalls: boolean;
  /** WebGL bindTexture calls per frame, including repeated and null bindings. */
  readonly textureBinds: boolean;
  /** WebGL useProgram calls per frame, including repeated and null uses. */
  readonly programUses: boolean;
}
