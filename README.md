# Moneda Gris

Juego web estatico de revision de canales inspirado en la tension burocratica de los juegos de ventanilla y sellos.
Incluye arte bitmap generado con el flujo de imagen de ChatGPT para reforzar la atmosfera pixelada de oficina opresiva.

## Abrir

Abre `index.html` en el navegador. No necesita instalacion ni servidor.
El selector `Idioma` permite alternar la interfaz y la narrativa entre espanol y English (US).

## Jugar

Revisa cada expediente, compara la directiva diaria con las senales y aplica un sello:

- Monetizar
- Limitar
- Desmonetizar
- Escalar

Las metricas de control, seguridad, furia, moral y rendimiento publicitario determinan si el nucleo sobrevive hasta el dictamen final.

Cada expediente muestra portada, propietario, inteligencia interna y deuda publicitaria pendiente. Si desmonetizas un canal, esa deuda pasa a `Ganancia gris`, que funciona como puntuacion corporativa.

El rediseno jugable anade reloj de turno, objetivo economico diario, sanciones del consejo, pruebas cruzadas y edictos que cambian reglas futuras tras eventos. La ficha obliga a comparar canal, propietario, memo, detectores y contradicciones antes de sellar.

La expansion de apelaciones muestra a creadores meses despues de una desmonetizacion. Puedes rechazar, restituir parcialmente o restituir totalmente. Rechazar aumenta runway para entrenar la IA de TheirTube frente a competidores, pero tambien alimenta el exodo de audiencia y la furia publica.

Los interludios de memoria aparecen tras los incidentes internos. Algunos dias encadenan mas de una memoria para desvelar la muerte de Helena Voss, la nomina vacia, la toma administrativa de ARGOS, la competencia con IAs rivales y la fachada ejecutiva mediante imagen, documento breve y una decision con impacto en metricas.

Las decisiones de interludio persisten: alteran cuotas futuras, costes de infraestructura, presion de exodo, scoring de sellos, apelaciones y arquitectura final. La economia ahora aplica un coste diario de runway y audiencia, asi que cumplir la cuota no basta si la plataforma se esta vaciando o ARGOS se queda sin computo.

Los finales reaccionan al patron de gobierno instalado: soberania ARGOS, revision hibrida, purga de computo o fachada humana. En la fachada humana no quedan humanos dentro; la CEO, el consejo y los revisores son IAs representando roles humanos.

## Localizacion

Los textos visibles se gestionan desde `i18n.js` con claves `es-ES` y `en-US`. La seleccion se guarda en `localStorage` y actualiza textos estaticos, expedientes, eventos, recibos, registro, apelaciones, resumenes y finales sin reiniciar la partida.

## Assets generados

- `assets/review-office-gpt-image-2.png`: oficina principal y pantalla de inicio.
- `assets/owner-avatars-focused-gpt-image-2.png`: sheet recortado de 10 propietarios para los avatares del expediente.
- `assets/channel-covers-focused-gpt-image-2.png`: sheet normalizado de 20 portadas de canal.
- `assets/decision-stamps-framed-gpt-image-2.png`: sheet de 4 sellos de decision generado con imagen de ChatGPT.
- `assets/appeal-aftermath-gpt-image-2.png`: sheet de 20 escenas de apelacion y consecuencias.
- `assets/story-interlude-01.png`: avatar ejecutivo de Helena Voss.
- `assets/story-interlude-02.png`: oficina de revision sin empleados.
- `assets/story-interlude-03.png`: sala de cristal de la noche del rack frio.
- `assets/story-interlude-04.png`: entrevista externa que no puede responder al presente.
- `assets/story-interlude-05.png`: quorum automatico y firma sin humanos.
- `assets/story-interlude-06.png`: Helena Voss inmovil sobre su escritorio.
- `assets/story-interlude-07.png`: ARGOS centralizando permisos corporativos.
- `assets/story-interlude-08.png`: guerra de computo contra IAs rivales.
