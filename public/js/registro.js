document.addEventListener('DOMContentLoaded', () => {
  const showCoordinatesButton = document.querySelector('.btn-coordinates');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const passwordRequirements = document.querySelectorAll('#password-requirements .requirement');
  const form = document.getElementById('register-form');

  // Mostrar coordenadas
  showCoordinatesButton.addEventListener('click', () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          alert(`Tus coordenadas son:\nLatitud: ${latitude}\nLongitud: ${longitude}`);
        },
        (error) => {
          alert('No se pudo obtener las coordenadas.');
        }
      );
    } else {
      alert('La geolocalización no está soportada en tu navegador.');
    }
  });

  // Validar requisitos de contraseña
  passwordInput.addEventListener('input', () => {
    const value = passwordInput.value;

    // Validar cada requisito
    passwordRequirements[0].classList.toggle('valid', value.length >= 8); // Longitud mínima
    passwordRequirements[1].classList.toggle('valid', /[A-Z]/.test(value)); // Letra mayúscula
    passwordRequirements[2].classList.toggle('valid', /[a-z]/.test(value)); // Letra minúscula
    passwordRequirements[3].classList.toggle('valid', /\d/.test(value)); // Número
    passwordRequirements[4].classList.toggle('valid', /[!@#$%^&*(),.?":{}|<>]/.test(value)); // Carácter especial
  });

  // Validar que las contraseñas coincidan
  form.addEventListener('submit', (e) => {
    if (passwordInput.value !== confirmPasswordInput.value) {
      e.preventDefault();
      alert('Las contraseñas no coinciden.');
    }
  });
});

function togglePassword() {
  const passwordInput = document.getElementById('password');
  const toggleIcon = document.querySelector('.password-toggle');
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleIcon.classList.remove('fa-eye');
    toggleIcon.classList.add('fa-eye-slash'); // Cambiar a "ocultar"
  } else {
    passwordInput.type = 'password';
    toggleIcon.classList.remove('fa-eye-slash');
    toggleIcon.classList.add('fa-eye'); // Cambiar a "mostrar"
  }
}

function toggleConfirmPassword() {
  const confirmPasswordInput = document.getElementById('confirm-password');
  const toggleIcon = confirmPasswordInput.nextElementSibling; // Selecciona el ícono dentro del contenedor
  if (confirmPasswordInput.type === 'password') {
    confirmPasswordInput.type = 'text';
    toggleIcon.classList.remove('fa-eye');
    toggleIcon.classList.add('fa-eye-slash'); // Cambiar a "ocultar"
  } else {
    confirmPasswordInput.type = 'password';
    toggleIcon.classList.remove('fa-eye-slash');
    toggleIcon.classList.add('fa-eye'); // Cambiar a "mostrar"
  }
}
