import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';

const traceExporter = new OTLPTraceExporter({
  url: 'http://localhost:4318/v1/traces', // Đổi endpoint nếu cần
});
const sdk = new NodeSDK({
  traceExporter: traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
  resource: resourceFromAttributes({
    'service.name': 'trace-service',
  }),
});
sdk.start();
