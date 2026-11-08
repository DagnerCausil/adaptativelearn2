import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ItemsModule } from './items/items.module.js';
import { DocentesModule } from './docentes/docentes.module.js';
import { EstudiantesModule } from './estudiantes/estudiantes.module.js';
import { ResultadosModule } from './resultados/resultados.module.js';
import { InscripcionesModule } from './inscripciones/inscripciones.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    ItemsModule,
    DocentesModule,
    EstudiantesModule,
    ResultadosModule,
    InscripcionesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
