// Wastelligence – Bewegung beim Scrollen und Kontaktformular (ohne Bibliotheken)

const ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Kopfzeile bekommt beim Scrollen einen Schatten
const kopf = document.querySelector(".kopf");
const kopfPruefen = () => kopf && kopf.classList.toggle("gescrollt", window.scrollY > 8);
kopfPruefen();
window.addEventListener("scroll", kopfPruefen, { passive: true });

if (!ruhig && "IntersectionObserver" in window) {
  // Elemente beim Hineinscrollen einblenden, Gruppen leicht versetzt
  const einzeln = ".kicker, .leitsatz, h2.titel, .einleitung, .paar, .produkt-text, .seitenkopf > *, .kontakt > *, .partner > div, .video-gross, .formular, .kontakt-wege .weg";
  const gruppen = ".raster, .zahlen, .zeitleiste, .partner-liste";
  document.querySelectorAll(einzeln).forEach((el) => el.classList.add("einblenden"));
  document.querySelectorAll(gruppen).forEach((g) =>
    [...g.children].forEach((el, i) => {
      el.classList.add("einblenden");
      el.style.transitionDelay = `${i * 90}ms`;
    })
  );

  const beobachter = new IntersectionObserver(
    (eintraege) =>
      eintraege.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("sichtbar");
        beobachter.unobserve(e.target);
      }),
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );
  document.querySelectorAll(".einblenden").forEach((el) => beobachter.observe(el));

  // Zahlen hochzählen, z.B. „27 %“ oder „8 von 10“
  const zaehler = new IntersectionObserver(
    (eintraege) =>
      eintraege.forEach((e) => {
        if (!e.isIntersecting) return;
        zaehler.unobserve(e.target);
        const text = e.target.textContent;
        const treffer = text.match(/\d+/);
        if (!treffer) return;
        const ziel = Number(treffer[0]);
        const start = performance.now();
        const dauer = 1400;
        const schritt = (jetzt) => {
          const t = Math.min((jetzt - start) / dauer, 1);
          const wert = Math.round(ziel * (1 - Math.pow(1 - t, 3)));
          e.target.textContent = text.replace(treffer[0], wert);
          if (t < 1) requestAnimationFrame(schritt);
        };
        requestAnimationFrame(schritt);
      }),
    { threshold: 0.6 }
  );
  document.querySelectorAll(".zahl b").forEach((el) => zaehler.observe(el));

  // Renderings bewegen sich beim Scrollen leicht mit
  const bilder = [...document.querySelectorAll(".buehne-bild, .produkt-bild")];
  if (bilder.length) {
    let geplant = false;
    const bewegen = () => {
      geplant = false;
      const mitte = window.innerHeight / 2;
      bilder.forEach((bild) => {
        const r = bild.getBoundingClientRect();
        const abstand = (r.top + r.height / 2 - mitte) / window.innerHeight;
        bild.style.setProperty("--versatz", `${(abstand * -60).toFixed(1)}px`);
      });
    };
    window.addEventListener("scroll", () => {
      if (!geplant) { geplant = true; requestAnimationFrame(bewegen); }
    }, { passive: true });
    bewegen();
  }
}

// Kontaktformular ohne Seitenwechsel absenden
const formular = document.getElementById("kontaktformular");
if (formular) {
  const status = formular.querySelector(".status");
  const knopf = formular.querySelector("button[type=submit]");

  formular.addEventListener("submit", async (ereignis) => {
    ereignis.preventDefault();
    knopf.disabled = true;
    knopf.textContent = "Wird gesendet …";
    status.className = "status";
    status.textContent = "";

    try {
      const antwort = await fetch(formular.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(formular),
      });
      const daten = await antwort.json();
      if (!antwort.ok || !daten.success) throw new Error(daten.message);
      formular.reset();
      status.classList.add("ok");
      status.textContent = "Danke! Deine Nachricht ist bei uns angekommen, wir melden uns bald.";
    } catch {
      status.classList.add("fehler");
      status.innerHTML = 'Das hat leider nicht geklappt. Schreib uns bitte direkt an <a href="mailto:info@wastelligence.com">info@wastelligence.com</a>.';
    } finally {
      knopf.disabled = false;
      knopf.textContent = "Nachricht senden";
    }
  });
}
