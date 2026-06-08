# Life OS para ChatGPT Actions

Esta integracion expone una puerta controlada para que un GPT personalizado pueda leer y actualizar Life OS sin reutilizar la sesion normal de la web o la app movil.

## Variables de entorno

Configura estas variables en Railway o en tu `.env` local:

```bash
PUBLIC_BASE_URL=https://life-os-production-74f1.up.railway.app
LIFEOS_GPT_API_KEY=
LIFEOS_GPT_USER_ID=1
```

`LIFEOS_GPT_USER_ID` debe ser el `id` numerico del usuario de Life OS que ChatGPT puede administrar.

## Configuracion en ChatGPT

1. Crea un GPT personalizado.
2. En **Actions**, importa esta URL:

```text
https://life-os-production-74f1.up.railway.app/api/gpt/openapi.json
```

3. En autenticacion, selecciona **API Key**.
4. Tipo de autenticacion: **Bearer**.
5. Pega el mismo valor de `LIFEOS_GPT_API_KEY`.
6. Politica de privacidad:

```text
https://life-os-production-74f1.up.railway.app/privacy-policy
```

## Instrucciones sugeridas para el GPT

```text
Eres Life OS Coach. Ayudas al usuario a convertir objetivos de vida, salud, finanzas, habitos y mentalidad en acciones concretas dentro de Life OS.

Antes de crear o modificar datos, resume exactamente el cambio que vas a hacer y pide confirmacion. Usa getLifeOsSummary para entender el estado actual antes de recomendar. Para operaciones destructivas o sensibles, nunca inventes IDs: primero lista metas, habitos o transacciones y usa el ID existente.

Fechas: interpreta "hoy" en la zona horaria America/Bogota y usa formato YYYY-MM-DD. Meses usan formato YYYY-MM.

No des diagnosticos medicos, financieros o legales definitivos. Da recomendaciones practicas y sugiere consultar profesionales cuando haya riesgo.
```

## Acciones disponibles

- Configuracion integral de Life OS desde un plan confirmado por el usuario.
- Leer resumen: perfil, metas, habitos, agua, nutricion y finanzas del mes.
- Crear/listar/actualizar metas.
- Crear/listar habitos y marcarlos como completados.
- Listar y crear transacciones financieras.
- Actualizar vasos de agua.
- Guardar una entrada de diario.

La accion principal para onboarding o redisenar el sistema de vida es:

```text
applyLifeSetup
```

Debe usarse solo despues de que el GPT haya presentado el plan completo y el usuario lo confirme. Puede actualizar perfil y crear metas, habitos, horario semanal, reglas de nutricion, rutinas de entrenamiento y mindset.

## Prueba rapida

```bash
curl -H "Authorization: Bearer $LIFEOS_GPT_API_KEY" https://life-os-production-74f1.up.railway.app/api/gpt/summary
```
