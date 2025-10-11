# Guía de Contribución

¡Gracias por tu interés en contribuir a Tiqly App! Aquí encontrarás toda la información necesaria para empezar.

## 🛠 Cómo empezar

1. **Haz un fork** del repositorio
2. **Clona tu fork** localmente
   ```bash
   git clone https://github.com/tuusuario/tiqly-app.git
   ```
3. **Instala las dependencias**
   ```bash
   cd tiqly-app
   npm install
   ```
4. **Crea una rama** para tu característica o corrección
   ```bash
   git checkout -b feature/nombre-de-tu-caracteristica
   ```
5. **Haz tus cambios** siguiendo las guías de estilo
6. **Haz commit** de tus cambios
   ```bash
   git commit -m "feat: Añadir nueva característica"
   ```
7. **Haz push** a tu rama
   ```bash
   git push origin feature/nombre-de-tu-caracteristica
   ```
8. **Abre un Pull Request**

## 📝 Guía de Estilo de Código

### Estructura de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva característica
- `fix:` Corrección de errores
- `docs:` Cambios en la documentación
- `style:` Cambios de formato (puntuación, espacios, etc.)
- `refactor:` Cambios en el código que no corrigen errores ni añaden características
- `perf:` Mejoras de rendimiento
- `test:` Añadir o modificar pruebas
- `chore:` Cambios en el proceso de build o herramientas auxiliares

### Estilo de código

- Usar TypeScript con tipos estrictos
- Seguir las convenciones de nomenclatura de React/React Native
- Escribir comentarios claros y concisos
- Mantener las funciones pequeñas y con una sola responsabilidad

## 🚦 Proceso de Revisión de Código

1. Crea un Pull Request (PR) con una descripción clara de los cambios
2. Asigna revisores relevantes
3. Resuelve los comentarios de revisión
4. Una vez aprobado, el mantenedor fusionará los cambios

## 📋 Reporte de Errores

Por favor, crea un issue con:

1. Descripción clara del problema
2. Pasos para reproducir
3. Comportamiento esperado vs. actual
4. Capturas de pantalla si es aplicable
5. Versión de la aplicación y sistema operativo

## 🆕 Solicitud de Características

Abre un issue con:

1. Descripción detallada de la característica
2. Casos de uso
3. Beneficios esperados
4. Posibles impactos

## 📜 Código de Conducta

Por favor, revisa nuestro [Código de Conducta](CODE_OF_CONDUCT.md) antes de contribuir.
