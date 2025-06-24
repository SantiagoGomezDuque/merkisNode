document.addEventListener('DOMContentLoaded', () => {
  const showCoordinatesButton = document.querySelector('.btn-coordinates');

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
});