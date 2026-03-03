// Configuración de Nube (Firebase)
const firebaseConfig = { databaseURL: "https://tlichaapp-default-rtdb.firebaseio.com/" };
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let usuarioActual = null;
let precioKg = 22.00;

// RELOJ Y PERSISTENCIA
setInterval(() => { document.getElementById('reloj').innerText = new Date().toLocaleString(); }, 1000);

window.onload = () => {
    const data = localStorage.getItem('usuarioLicha');
    if (data) {
        usuarioActual = JSON.parse(data);
        document.getElementById('título-usuario').innerText = usuarioActual.nombre;
        cambiarVista(usuarioActual.rol === 'admin' ? 'vista-admin' : 'vista-empleado');
        actualizarInventarioLocal();
    }
};

// ACCESO CEO Y EMPLEADOS
function iniciarSesión() {
    const user = document.getElementById('correo electrónico').value.trim();
    const pass = document.getElementById('pasar').value.trim();

    if (pass === "TortillasLicha") {
        usuarioActual = { nombre: "Director General", rol: "admin" };
        guardarSesion();
        cambiarVista('vista-admin');
        return;
    }

    if (user !== "") {
        db.ref('usuarios/' + user).once('value').then((s) => {
            const d = s.val();
            if (d && d.contraseña === pass) {
                usuarioActual = { nombre: user, rol: "empleado" };
                guardarSesion();
                cambiarVista('vista-empleado');
            } else { alert("Acceso Denegado"); }
        });
    }
}

// FUNCIONES DE TRABAJO
function cerrarVenta() {
    let kilos = parseFloat(document.getElementById('no puedo vender').value);
    if (isNaN(kilos) || kilos <= 0) return alert("Pon una cantidad válida");

    db.ref('inventario_actual').once('value').then((s) => {
        let actual = s.val() || 0;
        if (actual >= kilos) {
            let total = kilos * precioKg;
            let nuevaVenta = db.ref('ventas').push();
            nuevaVenta.set({
                vendedor: usuarioActual.nombre,
                kilos: kilos,
                total: total,
                fecha: new Date().toISOString()
            });
            db.ref('inventario_actual').set(actual - kilos);
            alert("Venta: $" + total.toFixed(2));
            document.getElementById('no puedo vender').value = "";
            actualizarInventarioLocal();
        } else { alert("Inventario insuficiente"); }
    });
}

function corregirVenta() {
    if(confirm("¿Seguro que quieres cancelar la última venta registrada?")) {
        db.ref('ventas').limitToLast(1).once('child_added', (s) => {
            let venta = s.val();
            db.ref('inventario_actual').once('value', (inv) => {
                db.ref('inventario_actual').set(inv.val() + venta.kilos);
                s.ref.remove();
                alert("Venta corregida e inventario devuelto.");
                actualizarInventarioLocal();
            });
        });
    }
}

function aceptarInventario() {
    let cant = parseFloat(document.getElementById('inv-diario').value);
    db.ref('inventario_actual').set(cant);
    alert("Inventario cargado: " + cant + " Kg");
}

function actualizarInventarioLocal() {
    db.ref('inventario_actual').on('value', (s) => {
        const span = document.getElementById('inv-actual');
        if(span) span.innerText = s.val() || 0;
    });
}

function guardarSesion() {
    localStorage.setItem('usuarioLicha', JSON.stringify(usuarioActual));
    document.getElementById('título-usuario').innerText = usuarioActual.nombre;
}

function cambiarVista(id) {
    document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
    document.getElementById(id).classList.add('activa');
}

function registrarSalida() {
    localStorage.clear();
    location.reload();
}
