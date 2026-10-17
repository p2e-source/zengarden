export class Soundscape {
    ctx?: AudioContext;
    master?: GainNode;
    rain?: GainNode;
    water?: GainNode;
    wind?: GainNode;
    timer?: ReturnType<typeof setInterval>;
    mood = 'morning';
    enabled = false;
    get running() { return this.ctx?.state === 'running'; }
    async start(volume: number, muted: boolean, mood: string, enable: boolean) { if (!enable && !this.enabled)
        return; this.enabled = true; try {
        if (!this.ctx) {
            const Constructor = window.AudioContext || (window as unknown as {
                webkitAudioContext: typeof AudioContext;
            }).webkitAudioContext;
            const c = this.ctx = new Constructor();
            this.master = c.createGain();
            this.master.connect(c.destination);
            let buffer = c.createBuffer(1, c.sampleRate * 3, c.sampleRate), data = buffer.getChannelData(0), last = 0;
            for (let i = 0; i < data.length; i++) {
                last = (last + (Math.random() * 2 - 1) * .05) / 1.05;
                data[i] = last * 3;
            }
            for (let kind of ['rain', 'water', 'wind'] as const) {
                let source = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain();
                source.buffer = buffer;
                source.loop = true;
                filter.type = 'lowpass';
                filter.frequency.value = kind === 'rain' ? 3500 : kind === 'water' ? 850 : 300;
                source.connect(filter);
                filter.connect(gain);
                gain.connect(this.master);
                gain.gain.value = 0;
                this[kind] = gain;
                source.start();
            }
            this.timer = setInterval(() => this.bird(), 6400);
        }
        await this.ctx.resume();
        this.update(volume, muted, mood);
        this.bird();
    }
    catch {
        this.enabled = false;
    } }
    update(volume: number, muted: boolean, mood: string) { this.mood = mood; if (!this.ctx)
        return; let t = this.ctx.currentTime; this.master?.gain.setTargetAtTime(muted ? 0 : volume, t, .15); this.rain?.gain.setTargetAtTime(mood === 'rain' ? .6 : 0, t, 1); this.wind?.gain.setTargetAtTime(.2, t, 1); this.water?.gain.setTargetAtTime(.18, t, 1); }
    bird() { if (!this.ctx || !this.master || document.hidden || this.mood === 'night' || this.mood === 'rain')
        return; let c = this.ctx, t = c.currentTime; for (let i = 0; i < 3; i++) {
        let o = c.createOscillator(), g = c.createGain(), a = t + i * .18;
        o.type = 'sine';
        o.frequency.setValueAtTime(1650 + i * 190, a);
        o.frequency.exponentialRampToValueAtTime(2700, a + .06);
        o.frequency.exponentialRampToValueAtTime(1800, a + .13);
        g.gain.setValueAtTime(.0001, a);
        g.gain.linearRampToValueAtTime(.045, a + .02);
        g.gain.exponentialRampToValueAtTime(.0001, a + .15);
        o.connect(g);
        g.connect(this.master);
        o.start(a);
        o.stop(a + .16);
        o.onended = () => { o.disconnect(); g.disconnect(); };
    } }
    suspend() { void this.ctx?.suspend(); }
    dispose() { clearInterval(this.timer); void this.ctx?.close(); }
}
