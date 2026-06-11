export const uploadImageToCloudinary = async (file) => {
  // Configuración de Cloudinary
  // Debes reemplazar estas variables con tus credenciales o usar variables de entorno de Vite
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'TU_CLOUD_NAME';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'TU_UPLOAD_PRESET';

  if (cloudName === 'TU_CLOUD_NAME' || uploadPreset === 'TU_UPLOAD_PRESET') {
    console.warn('⚠️ Faltan las credenciales de Cloudinary. Usando una imagen simulada.');
    // Simulamos una subida retornando una URL de imagen dummy si no hay credenciales
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(URL.createObjectURL(file));
      }, 1000);
    });
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Error subiendo la imagen a Cloudinary');
    }

    const data = await res.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error en uploadImageToCloudinary:', error);
    throw error;
  }
};
