/** Use matching native GPU implementations on macOS and software WebGL on hosted VMs. */
export function chromiumOptions(backend: 'webgl2' | 'webgpu') {
  const args = ['--enable-unsafe-webgpu'];
  // CI declares its renderer; local runs keep the native macOS parity fix.
  const renderer =
    process.env.REPARTICLE_TEST_RENDERER ?? (process.platform === 'darwin' ? 'metal' : 'auto');
  if (renderer === 'metal') {
    // Without this, headless WebGL may use SwiftShader while WebGPU uses Metal.
    // Their different trigonometric precision makes simulation parity tests fail.
    args.push('--use-angle=metal');
  } else if (backend === 'webgl2' && renderer === 'software') {
    args.push('--use-angle=swiftshader', '--enable-unsafe-swiftshader');
  }
  return { channel: 'chromium', headless: true, args };
}
