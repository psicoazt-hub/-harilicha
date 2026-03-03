// CONFIGURACIÓN DE NUBE (Reemplaza con tus llaves cuando las tengas)
const firebaseConfig = { apiKey: "TU_API", authDomain: "TU_DOMINIO", databaseURL: "TU_URL" };
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let usuarioActual = JSON.parse(localStorage.getItem('usuarioLicha')) || null;
let inventario = JSON.parse(localStorage.getItem('inventarioLicha')) || 0;

// RELOJ EN TIEMPO REAL
setInterval(() => {
    const reloj = document.getElementById('reloj');
    if(reloj) reloj.innerText = new Date().toLocaleString();
}, 1000);

// PERSISTENCIA DE SESIÓN
window.onload = () => {
    if (usuarioActual) {
        document.getElementById('titulo-usuario').innerText = usuarioActual.nombre;
        cambiarVista(usuarioActual.rol === 'admin' ? 'vista-admin' : 'vista-empleado');
    }
};

function cambiarVista(id) {
    document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
    const vista = document.getElementById(id);
    if(vista) vista.classList.add('activa');
}

// LOGICA DE ACCESO
function login() {
    const user = document.getElementById('email').value.trim();
    const pass = document.getElementById('pass').value.trim();

    // 1. LLAVE MAESTRA UNIVERSAL (CEO)
    if (pass === "TortillasLicha") {
        usuarioActual = { nombre: "Pantera CEO", rol: "admin" };
        localStorage.setItem('usuarioLicha', JSON.stringify(usuarioActual));
        document.getElementById('titulo-usuario').innerText = "CEO: " + usuarioActual.nombre;
        cambiarVista('vista-admin');
        return;
    }

    // 2. BUSQUEDA EN NUBE PARA EMPLEADOS
    if (user !== "") {
        db.ref('usuarios/' + user).once('value').then((snapshot) => {
            const datos = snapshot.val();
            if (datos && datos.password === pass) {
                usuarioActual = { nombre: user, rol: 'empleado' };
                localStorage.setItem('usuarioLicha', JSON.stringify(usuarioActual));
                document.getElementById('titulo-usuario').innerText = usuarioActual.nombre;
                cambiarVista('vista-empleado');
            } else {
                alert("Acceso denegado: Usuario o contraseña incorrectos.");
            }
        }).catch(() => alert("Error de red: Verifica que la nube esté configurada."));
    } else {
        alert("Introduce un usuario o usa la Llave Maestra.");
    }
}

// CREACIÓN DE PERFILES (SOLO CEO)
function crearPerfil() {
    const nombre = prompt("Nombre del nuevo empleado (ej. Oscar):");
    const clave = prompt("Asigna una contraseña para él:");
    if (nombre && clave) {
        db.ref('usuarios/' + nombre).set({
            password: clave,
            rol: 'empleado'
        }).then(() => alert("Perfil de " + nombre + " guardado en la nube con éxito."));
    }
}

// FUNCIONES DE TRABAJO
function aceptarInventario() {
    inventario = parseInt(document.getElementById('inv-diario').value) || 0;
    localStorage.setItem('inventarioLicha', inventario);
    db.ref('inventario_actual').set(inventario); // Sube a la nube
    alert("Inventario actualizado.");
}

function cerrarVenta() {
    let cant = parseInt(document.getElementById('cant-vender').value);
    let precio = parseFloat(document.getElementById('precio-paquete').value);
    let total = cant * precio;
    inventario -= cant;
    
    db.ref('ventas/' + usuarioActual.nombre).push({ 
        cant, total, fecha: new Date().toISOString() 
    }); // Sube venta a la nube
    
    localStorage.setItem('inventarioLicha', inventario);
    alert(`Cobro: $${total}. Restan ${inventario} paquetes.`);
}

function registrarSalida() {
    localStorage.clear();
    location.reload();
}

function regresarAlMenu() {
    cambiarVista(usuarioActual.rol === 'admin' ? 'vista-admin' : 'vista-empleado');
}
