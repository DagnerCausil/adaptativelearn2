import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ItemsModule } from './items/items.module.js';
import { OpcionesModule } from './opciones/opciones.module.js';
import { DocentesModule } from './docentes/docentes.module.js';
import { EstudiantesModule } from './estudiantes/estudiantes.module.js';
import { ResultadosModule } from './resultados/resultados.module.js';
import { InscripcionesModule } from './inscripciones/inscripciones.module.js';
import { RespuestasModule } from './respuestas/respuestas.module.js';
import { DbasModule } from './dbas/dbas.module.js';
import { EvidenciasModule } from './evidencias/evidencias.module.js';
import { DictamenesEvidenciaModule } from './dictamenes_evidencia/dictamenes-evidencia.module.js';
import { ExperienciasModule } from './experiencias/experiencias.module.js';
import { ExperienciasEvidenciasModule } from './experiencias_evidencias/experiencias-evidencias.module.js';

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
    OpcionesModule,
    DocentesModule,
    EstudiantesModule,
    ResultadosModule,
    InscripcionesModule,
    RespuestasModule,
    DbasModule,
    EvidenciasModule,
    DictamenesEvidenciaModule,
    ExperienciasModule,
    ExperienciasEvidenciasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
