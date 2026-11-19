# AutoCadastro

Aplicação web para manutenção de cadastro de automóveis com persistência no **Firebase Firestore**.

## Funcionalidades

- Cadastrar automóvel (marca, modelo, cor, placa, ano, km)
- Listar todos os automóveis em tempo real
- Editar um automóvel já cadastrado

## Como configurar o Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/) e crie um projeto (ou use um existente).
2. No menu, abra **Build → Firestore Database** e crie o banco (modo de produção ou teste).
3. Em **Regras**, para o demo acadêmico você pode usar temporariamente:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /automoveis/{docId} {
      allow read, write: if true;
    }
  }
}
```

> Atenção: `allow read, write: if true` é só para demonstração. Não use em produção.

4. Vá em **Configurações do projeto → Seus apps → Web** e registre um app.
5. Copie o objeto `firebaseConfig` e cole em `js/firebase-config.js`, substituindo os valores `COLE_...`.
6. Publique as regras do Firestore.

## Como abrir a aplicação

Como a app usa módulos ES (`type="module"`), abra com um servidor local:

- **VS Code / Cursor:** extensão Live Server → “Open with Live Server” em `index.html`
- Ou, com Python: `python -m http.server 5500` na pasta do projeto e acesse `http://localhost:5500`

Não abra o arquivo direto via `file://` - o navegador bloqueia os imports.

## Coleção no Firestore

Nome da coleção: `automoveis`

Campos salvos:

| Campo | Tipo |
|-------|------|
| marca | string |
| modelo | string |
| cor | string |
| placa | string |
| anoFabricacao | number |
| kmRodada | number |
| atualizadoEm | timestamp |

## Roteiro sugerido para o vídeo de entrega

1. Mostrar a tela da aplicação (formulário + lista).
2. Cadastrar um automóvel e apontar a mensagem de sucesso.
3. Mostrar o registro na lista.
4. Editar o mesmo automóvel (ex.: alterar km ou cor) e salvar.
5. Abrir o **Firebase Console → Firestore** e mostrar a coleção `automoveis` com os dados persistidos.
6. (Opcional) Cadastrar um segundo carro para reforçar a listagem.

## Estrutura

```
/
├── index.html
├── css/styles.css
├── js/
│   ├── firebase-config.js
│   ├── firebase.js
│   └── app.js
└── README.md
```
