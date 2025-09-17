/*
 * Servidor Node.js simples para processar inscrições do Turing Cineclube.
 *
 * Este arquivo define uma API HTTP que aceita requisições POST na rota
 * `/subscribe` e envia um e‑mail de boas‑vindas ao inscrito. As informações do
 * inscrito (nome, e‑mail e telefone) são salvas em um arquivo CSV chamado
 * `subscribers.csv` no mesmo diretório para referência futura. Para evitar
 * expor credenciais sensíveis no código, utilize um arquivo `.env` com as
 * variáveis `EMAIL_USERNAME`, `EMAIL_PASSWORD` e `SMTP_HOST`. Esses dados são
 * lidos com a biblioteca `dotenv`.
 *
 * Para iniciar este servidor, instale as dependências com:
 *   npm install express nodemailer dotenv
 * Em seguida, execute:
 *   node server.js
 * Por padrão, o servidor escuta na porta 3000 (configurável via variáveis de
 * ambiente). Em produção, hospede este servidor em uma plataforma que suporte
 * Node.js (Heroku, Vercel, Render, etc.) e atualize a URL do formulário no
 * arquivo `registration_form.html` para apontar para essa API.
 */

const express = require('express');
const fs = require('fs');
const nodemailer = require('nodemailer');
const path = require('path');
const dotenv = require('dotenv');

// Carrega variáveis de ambiente do arquivo .env, se existir
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para interpretar dados do formulário (x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Define a rota para processar inscrições
app.post('/subscribe', async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }

  // Registra o inscrito em um arquivo CSV (append mode)
  const csvLine = `"${name}","${email}","${phone}",${new Date().toISOString()}\n`;
  try {
    fs.appendFileSync(path.join(__dirname, 'subscribers.csv'), csvLine);
  } catch (err) {
    console.error('Falha ao registrar o inscrito:', err);
    // Não interrompe o fluxo; prossegue com o envio do e‑mail
  }

  // Configura o transportador SMTP usando Nodemailer
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
    secure: false, // use TLS se a porta for 465
    auth: {
      user: process.env.EMAIL_USERNAME || 'usuario@exemplo.com',
      pass: process.env.EMAIL_PASSWORD || 'senha'
    }
  });

  // Monta o conteúdo do e‑mail de boas‑vindas
  const mailOptions = {
    from: process.env.FROM_ADDRESS || 'Turing Cineclube <noreply@exemplo.com>',
    to: email,
    subject: 'Bem‑vindo(a) ao Turing Cineclube!',
    html: `
      <p>Olá ${name},</p>
      <p>Obrigado por se inscrever no <strong>Turing Cineclube</strong>! Estamos muito felizes em contar com sua participação.</p>
      <p>O Turing Cineclube é um espaço para discutir cinema, ciência da computação e cultura digital. Você receberá atualizações sobre nossas sessões, debates e novidades.</p>
      <p>Para começar a interagir com nossa comunidade, participe do grupo do WhatsApp através deste link ou código:</p>
      <p><a href="${process.env.WHATSAPP_LINK || 'https://chat.whatsapp.com/SEU_LINK_DO_GRUPO'}">Entrar no grupo do WhatsApp</a></p>
      <p>Esperamos vê‑lo(a) em breve!</p>
      <p>Abraços,<br/>Equipe Turing Cineclube</p>
    `
  };

  // Envia o e‑mail
  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar e‑mail:', error);
    return res.status(500).json({ error: 'Falha ao enviar o e‑mail de boas‑vindas.' });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor de inscrições iniciado na porta ${PORT}`);
});
