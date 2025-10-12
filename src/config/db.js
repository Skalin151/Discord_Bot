import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

export async function connectDB() {
  try {
    if (!uri) {
      console.warn('⚠️ MONGODB_URI não encontrado. Bot continuará sem persistência de dados.');
      return;
    }
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 segundos de timeout
    });
    console.log('✅ MongoDB conectado!');
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error.message);
    console.warn('⚠️ Bot continuará sem persistência de dados.');
    // NÃO mata o processo - deixa o bot funcionar sem DB
  }
}
