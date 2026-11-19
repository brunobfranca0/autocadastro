/**
 * Credenciais do projeto Firebase AutoCadastro.
 */
export const firebaseConfig = {
  apiKey: "AIzaSyAXkOQGru2WsVJptEkel-7ijy4lB9en9sw",
  authDomain: "autocadastro-2bc45.firebaseapp.com",
  projectId: "autocadastro-2bc45",
  storageBucket: "autocadastro-2bc45.firebasestorage.app",
  messagingSenderId: "888279714988",
  appId: "1:888279714988:web:df0f32f10e8c306b952309",
};

export function isFirebaseConfigured() {
  return Object.values(firebaseConfig).every((value) => {
    if (typeof value !== "string" || value.trim() === "") return false;
    return !value.startsWith("COLE_");
  });
}
