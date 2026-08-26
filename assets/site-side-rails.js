(() => {
    const rail = document.createElement('div');
    rail.id = 'site-side-rails';
    rail.innerHTML = `
        <div class="site-side-rail-left" aria-hidden="true">
            <div class="site-side-rail-kicker">YOUR CLAIM, PERSONALLY MANAGED</div>
            <div class="site-side-rail-spine"></div>
            <div class="site-side-rail-progress"></div>
            <div class="site-side-rail-steps">
                <div class="site-side-rail-step active"><span class="site-side-rail-dot">01</span><span>Set up<br>carefully</span></div>
                <div class="site-side-rail-step"><span class="site-side-rail-dot">02</span><span>Submit<br>clean</span></div>
                <div class="site-side-rail-step"><span class="site-side-rail-dot">03</span><span>Follow<br>through</span></div>
                <div class="site-side-rail-step"><span class="site-side-rail-dot">04</span><span>Reconcile<br>&amp; report</span></div>
            </div>
        </div>
        <div class="site-side-rail-right">
            <nav class="site-side-rail-tabs" aria-label="Homepage sections">
                <a class="site-side-rail-tab active" data-site-section="overview" href="#main-content">Overview</a>
                <a class="site-side-rail-tab" data-site-section="services" href="#services">Services</a>
                <a class="site-side-rail-tab" data-site-section="about" href="#about">About Jake</a>
                <a class="site-side-rail-tab" data-site-section="faq" href="#faq">FAQ</a>
                <a class="site-side-rail-tab" data-site-section="contact" href="#contact">Contact</a>
            </nav>
        </div>`;
    document.body.appendChild(rail);

    const progress = rail.querySelector('.site-side-rail-progress');
    const steps = [...rail.querySelectorAll('.site-side-rail-step')];
    const tabs = [...rail.querySelectorAll('.site-side-rail-tab')];
    const targets = [
        { key: 'overview', element: document.querySelector('main') },
        { key: 'services', element: document.getElementById('services') },
        { key: 'about', element: document.getElementById('about') },
        { key: 'faq', element: document.getElementById('faq') },
        { key: 'contact', element: document.getElementById('contact') }
    ].filter(item => item.element);

    let ticking = false;
    const update = () => {
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const ratio = Math.max(0, Math.min(1, window.scrollY / maxScroll));
        progress.style.height = `${Math.max(12, Math.min(94, 12 + ratio * 82))}%`;

        const stepIndex = Math.min(steps.length - 1, Math.floor(ratio * steps.length));
        steps.forEach((step, index) => {
            step.classList.toggle('active', index === stepIndex);
            step.classList.toggle('done', index < stepIndex);
        });

        const checkpoint = window.scrollY + window.innerHeight * .42;
        let activeKey = targets[0]?.key || 'overview';
        for (const target of targets) {
            if (target.element.offsetTop <= checkpoint) activeKey = target.key;
        }
        tabs.forEach(tab => {
            const isActive = tab.dataset.siteSection === activeKey;
            tab.classList.toggle('active', isActive);
            if (isActive) tab.setAttribute('aria-current', 'location');
            else tab.removeAttribute('aria-current');
        });
        ticking = false;
    };

    const scheduleUpdate = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    update();
})();
