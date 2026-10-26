import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ItemsModule } from './items/items.module.js';
import { DocentesModule } from './docentes/docentes.module.js';
import { EstudiantesModule } from './estudiantes/estudiantes.module.js';
import { ResultadosModule } from './resultados/resultados.module.js';
import { InscripcionesModule } from './inscripciones/inscripciones.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'adaptativelearn2_app',
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
