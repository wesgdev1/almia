/* Panel admin de invitaciones (solo el admin inicia sesion) */
(() => {
  const API = '/api/v1';
  const $ = (s) => document.querySelector(s);

  let token = localStorage.getItem('adminToken');
  let editingId = null;
  let list = [];

  // ---------- helpers ----------
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );

  const toast = (text) => {
    const t = $('#toast');
    t.textContent = text;
    t.classList.add('on');
    clearTimeout(toast.id);
    toast.id = setTimeout(() => t.classList.remove('on'), 2500);
  };

  const api = async (path, { method = 'GET', body } = {}) => {
    const res = await fetch(API + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (res.status === 403 || res.status === 401) {
      if (path !== '/users/signin') logout();
    }
    if (!res.ok) throw new Error(json.error?.message || `Error ${res.status}`);
    return json;
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast('Link copiado');
    } catch {
      prompt('Copia el link:', text);
    }
  };

  const fecha = (d) =>
    d ? new Date(d).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '';

  // ---------- auth ----------
  const showLogin = () => {
    $('#login').hidden = false;
    $('#panel').hidden = true;
  };

  const logout = () => {
    token = null;
    localStorage.removeItem('adminToken');
    showLogin();
  };

  $('#logout').onclick = logout;

  $('#login-form').onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    $('#login-error').textContent = '';
    try {
      const json = await api('/users/signin', {
        method: 'POST',
        body: { email: f.get('email'), password: f.get('password') },
      });
      token = json.meta.token;
      localStorage.setItem('adminToken', token);
      start();
    } catch (err) {
      $('#login-error').textContent = err.message;
    }
  };

  // ---------- data ----------
  const loadStats = async () => {
    const { data } = await api('/invitaciones/stats');
    const { invitaciones: i, personas: p } = data;
    const cards = [
      ['Personas confirmadas', `${p.confirmadas} / ${p.cuposTotales}`],
      ['Personas pendientes', p.pendientes],
      ['Personas que no van', p.rechazadas],
      ['Invitaciones', i.total],
      ['Confirmadas', i.confirmadas],
      ['Pendientes', i.pendientes],
      ['Rechazadas', i.rechazadas],
      ['Enviadas', `${i.enviadas} (${i.sinEnviar} sin enviar)`],
      ['Abiertas', i.vistas],
    ];
    $('#stats').innerHTML = cards
      .map(([k, v]) => `<div class="stat"><b>${esc(v)}</b><small>${esc(k)}</small></div>`)
      .join('');
  };

  const loadList = async () => {
    const params = new URLSearchParams();
    if ($('#f-q').value) params.set('q', $('#f-q').value);
    if ($('#f-estado').value) params.set('estado', $('#f-estado').value);
    if ($('#f-enviada').value) params.set('enviada', $('#f-enviada').value);

    const { data } = await api(`/invitaciones?${params}`);
    list = data;
    $('#count').textContent = `(${data.length})`;

    const grupos = [...new Set(data.map((x) => x.grupo).filter(Boolean))];
    $('#grupos').innerHTML = grupos.map((g) => `<option value="${esc(g)}">`).join('');

    $('#rows').innerHTML =
      data
        .map(
          (x) => `
      <tr data-id="${x.id}">
        <td><b>${esc(x.destino)}</b><div class="muted">${esc(x.telefono || '')}</div>
            ${x.notas ? `<div class="muted">📝 ${esc(x.notas)}</div>` : ''}</td>
        <td>${esc(x.grupo || '')}</td>
        <td>${x.cuposConfirmados} / ${x.cupos}</td>
        <td><span class="tag ${x.estado}">${x.estado}</span>
            <div class="muted">${esc(x.metodoConfirmacion || '')} ${fecha(x.fechaRespuesta)}</div></td>
        <td>${x.enviada ? `✔<div class="muted">${fecha(x.fechaEnvio)}</div>` : '—'}</td>
        <td>${x.vistas}<div class="muted">${fecha(x.ultimaVista)}</div></td>
        <td style="max-width:200px">${esc(x.mensaje || '')}</td>
        <td><div class="actions">
          <button class="sm primary" data-a="enviar">Enviar WhatsApp</button>
          <button class="sm" data-a="copiar">Copiar link</button>
          <button class="sm" data-a="ver">Ver</button>
          <button class="sm" data-a="confirmar">Confirmar</button>
          <button class="sm" data-a="rechazar">No va</button>
          <button class="sm" data-a="reset">Reset</button>
          <button class="sm" data-a="editar">Editar</button>
          <button class="sm danger" data-a="eliminar">Eliminar</button>
        </div></td>
      </tr>`,
        )
        .join('') || '<tr><td colspan="8" class="muted">No hay invitaciones</td></tr>';
  };

  const refresh = () => Promise.all([loadStats(), loadList()]).catch((e) => toast(e.message));

  // ---------- form crear / editar ----------
  const resetForm = () => {
    editingId = null;
    $('#inv-form').reset();
    $('#form-title').textContent = 'Nueva invitación';
    $('#form-submit').textContent = 'Crear';
    $('#form-cancel').hidden = true;
  };

  $('#form-cancel').onclick = resetForm;

  $('#inv-form').onsubmit = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    body.cupos = Number(body.cupos);
    try {
      if (editingId) {
        await api(`/invitaciones/${editingId}`, { method: 'PUT', body });
        toast('Invitación actualizada');
      } else {
        await api('/invitaciones', { method: 'POST', body });
        toast('Invitación creada');
      }
      resetForm();
      refresh();
    } catch (err) {
      toast(err.message);
    }
  };

  // ---------- acciones de la tabla ----------
  const actions = {
    async enviar(x) {
      // se abre la pestaña antes del await para que el navegador no la bloquee
      const win = window.open('', '_blank');
      try {
        const { meta } = await api(`/invitaciones/${x.id}/enviar`, { method: 'POST' });
        if (win) win.location = meta.whatsappUrl;
        else location.href = meta.whatsappUrl;
        refresh();
      } catch (err) {
        win?.close();
        toast(err.message);
      }
    },
    copiar: (x) => copy(x.link),
    ver: (x) => window.open(x.link, '_blank'),
    async confirmar(x) {
      const n = prompt(`¿Cuántas personas confirman? (máx ${x.cupos})`, x.cupos);
      if (n === null) return;
      const metodo = (prompt('Método: WHATSAPP, LLAMADA o MANUAL', 'WHATSAPP') || 'MANUAL').toUpperCase();
      await api(`/invitaciones/${x.id}/responder`, {
        method: 'PATCH',
        body: { asistira: true, cuposConfirmados: Number(n), metodo },
      });
      refresh();
    },
    async rechazar(x) {
      if (!confirm(`¿Marcar que ${x.destino} NO asistirá?`)) return;
      await api(`/invitaciones/${x.id}/responder`, {
        method: 'PATCH',
        body: { asistira: false },
      });
      refresh();
    },
    async reset(x) {
      if (!confirm(`¿Volver ${x.destino} a PENDIENTE?`)) return;
      await api(`/invitaciones/${x.id}/reset`, { method: 'PATCH' });
      refresh();
    },
    editar(x) {
      editingId = x.id;
      const f = $('#inv-form');
      for (const k of ['destino', 'cupos', 'telefono', 'grupo', 'notas']) {
        f.elements[k].value = x[k] ?? '';
      }
      $('#form-title').textContent = `Editando: ${x.destino}`;
      $('#form-submit').textContent = 'Guardar';
      $('#form-cancel').hidden = false;
      f.scrollIntoView({ behavior: 'smooth' });
    },
    async eliminar(x) {
      if (!confirm(`¿Eliminar la invitación de ${x.destino}? No se puede deshacer.`)) return;
      await api(`/invitaciones/${x.id}`, { method: 'DELETE' });
      toast('Eliminada');
      refresh();
    },
  };

  $('#rows').onclick = async (e) => {
    const btn = e.target.closest('button[data-a]');
    if (!btn) return;
    const x = list.find((i) => i.id === btn.closest('tr').dataset.id);
    try {
      await actions[btn.dataset.a](x);
    } catch (err) {
      toast(err.message);
    }
  };

  // ---------- filtros ----------
  let deb;
  $('#f-q').oninput = () => {
    clearTimeout(deb);
    deb = setTimeout(loadList, 300);
  };
  $('#f-estado').onchange = loadList;
  $('#f-enviada').onchange = loadList;

  // ---------- en vivo ----------
  if (window.io) {
    io().on('invitacion:respondida', (x) => {
      toast(`${x.destino}: ${x.estado}`);
      if (token) refresh();
    });
  }

  // ---------- inicio ----------
  async function start() {
    try {
      const { data } = await api('/users/me');
      $('#admin-name').textContent = data.name;
      $('#login').hidden = true;
      $('#panel').hidden = false;
      refresh();
    } catch {
      showLogin();
    }
  }

  token ? start() : showLogin();
})();
