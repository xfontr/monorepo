// The article body as WordPress would deliver it: plain HTML, no classes beyond what the editor
// emits. The lab styles it through `.hl-prose`, which is exactly how production will render it.

export const toc = [
    { id: "introduccion", label: "Introducción", level: 2 },
    { id: "accion", label: "La acción como punto de partida", level: 2 },
    { id: "tipicidad", label: "Tipicidad", level: 2 },
    { id: "tipo-objetivo", label: "El tipo objetivo", level: 3 },
    { id: "tipo-subjetivo", label: "El tipo subjetivo", level: 3 },
    { id: "antijuridicidad", label: "Antijuridicidad y causas de justificación", level: 2 },
    { id: "culpabilidad", label: "Culpabilidad", level: 2 },
    { id: "error-prohibicion", label: "El error de prohibición", level: 3 },
    { id: "conclusiones", label: "Conclusiones", level: 2 },
] as const;

export const body = `
<h2 id="introduccion"><span class="hl-num">I.</span> Introducción</h2>
<p>La teoría jurídica del delito es, ante todo, un método. Permite al juez recorrer un hecho en un orden fijo —acción, tipicidad, antijuridicidad, culpabilidad— y detenerse en cuanto una categoría falla. Esa disciplina no es un capricho académico: es la garantía de que dos tribunales enfrentados al mismo caso formulen las mismas preguntas, en el mismo orden, y lleguen a respuestas comparables.</p>
<p>El Código Penal no define el delito en esos términos. Su artículo 10 se limita a decir que «son delitos las acciones y omisiones dolosas o imprudentes penadas por la ley»<sup><a href="#nota-1" id="ref-1">1</a></sup>. Todo lo demás —qué es una acción, cuándo es típica, por qué puede estar justificada— lo ha construido la dogmática durante más de un siglo.</p>

<h2 id="accion"><span class="hl-num">II.</span> La acción como punto de partida</h2>
<p>Antes de preguntar si un hecho está prohibido hay que saber si es, siquiera, un hecho humano. El movimiento reflejo, el acto realizado bajo fuerza irresistible o en estado de inconsciencia plena no son acciones en sentido penal: no expresan voluntad alguna y, por tanto, no pueden ser objeto de reproche.</p>
<p>La discusión sobre qué es una acción enfrentó durante décadas a causalistas y finalistas. Para los primeros bastaba un movimiento corporal voluntario que causara un resultado; para Welzel y sus seguidores, la acción es siempre ejercicio de una actividad final, dirigida por la voluntad hacia un objetivo<sup><a href="#nota-2" id="ref-2">2</a></sup>.</p>
<blockquote><p>La voluntad final no es un añadido al movimiento corporal: es lo que convierte ese movimiento en una acción.</p><cite>Hans Welzel, <em>El nuevo sistema del Derecho penal</em></cite></blockquote>

<h2 id="tipicidad"><span class="hl-num">III.</span> Tipicidad</h2>
<p>Una acción es típica cuando encaja en la descripción que la ley hace de una conducta prohibida. El tipo cumple así una función de garantía —solo lo descrito puede castigarse— y una función indiciaria: si la conducta es típica, se presume, salvo prueba en contrario, que también es antijurídica.</p>
<h3 id="tipo-objetivo">1. El tipo objetivo</h3>
<p>El tipo objetivo reúne los elementos externos de la conducta: el sujeto, la acción descrita, el resultado cuando se exige y la relación entre ambos. En los delitos de resultado, la mera causalidad no basta; la doctrina mayoritaria exige además que el resultado sea <strong>objetivamente imputable</strong> a la conducta, es decir, que sea la realización del riesgo jurídicamente desaprobado que el autor creó.</p>
<ul>
<li>Que el autor haya creado un riesgo no permitido.</li>
<li>Que ese riesgo se haya realizado en el resultado.</li>
<li>Que el resultado caiga dentro del ámbito de protección de la norma.</li>
</ul>
<h3 id="tipo-subjetivo">2. El tipo subjetivo</h3>
<p>El tipo subjetivo atiende a la actitud interna del autor: el dolo, entendido como conocimiento y voluntad de realizar los elementos del tipo objetivo, o la imprudencia, cuando el resultado se produce por la infracción de un deber de cuidado. La distinción no es menor: el artículo 12 del Código Penal establece que las acciones imprudentes solo se castigan cuando la ley lo disponga expresamente.</p>

<aside class="hl-note"><p class="hl-note-title">Nota del editor</p><p>Este artículo forma parte de la serie <a href="#">Fundamentos del Derecho penal</a>. Si es tu primera lectura, empieza por <a href="#">El Derecho penal</a>.</p></aside>

<h2 id="antijuridicidad"><span class="hl-num">IV.</span> Antijuridicidad y causas de justificación</h2>
<p>Una conducta típica puede, sin embargo, estar permitida por el ordenamiento. Las causas de justificación —legítima defensa, estado de necesidad, cumplimiento de un deber o ejercicio legítimo de un derecho— no eliminan el tipo, pero sí su ilicitud: quien actúa justificado no comete un delito, aunque su conducta encaje en la descripción legal.</p>
<figure class="wp-block-table"><table>
<thead><tr><th scope="col">Categoría</th><th scope="col">Pregunta que responde</th><th scope="col">Si falta</th><th scope="col">Ejemplo</th></tr></thead>
<tbody>
<tr><td>Acción</td><td>¿Hay un comportamiento humano voluntario?</td><td>No hay delito</td><td>Movimiento reflejo</td></tr>
<tr><td>Tipicidad</td><td>¿Encaja en una conducta prohibida por la ley?</td><td>No hay delito</td><td>Conducta atípica</td></tr>
<tr><td>Antijuridicidad</td><td>¿Está prohibida también en este caso concreto?</td><td>Conducta justificada</td><td>Legítima defensa</td></tr>
<tr><td>Culpabilidad</td><td>¿Puede reprocharse al autor?</td><td>Exención o atenuación</td><td>Error de prohibición invencible</td></tr>
</tbody>
</table><figcaption class="wp-element-caption">Las categorías del delito y la consecuencia de su ausencia</figcaption></figure>

<h2 id="culpabilidad"><span class="hl-num">V.</span> Culpabilidad</h2>
<p>La culpabilidad es el juicio de reproche personal: la pregunta de si al autor, que actuó de forma típica y antijurídica, podía exigírsele que actuara de otro modo. Sin culpabilidad no hay pena, por grave que sea el hecho. Por eso el menor de edad, quien padece una anomalía psíquica que le impide comprender la ilicitud o quien actúa por miedo insuperable queda exento de responsabilidad criminal.</p>
<figure><div class="hl-figure-media" role="img" aria-label="Grabado de la Justicia con la balanza y la espada"><span aria-hidden="true">§</span></div><figcaption>La Justicia con la balanza y la espada, grabado del siglo XVIII. <span class="hl-credit">Dominio público.</span></figcaption></figure>
<h3 id="error-prohibicion">1. El error de prohibición</h3>
<p>Quien cree erróneamente que su conducta está permitida no actúa con plena conciencia de la ilicitud. El artículo 14 del Código Penal distingue según ese error pudiera o no haberse evitado:</p>
<div class="hl-law"><p class="hl-law-ref">Artículo 14.3 del Código Penal</p><p>El error invencible sobre la ilicitud del hecho constitutivo de la infracción penal excluye la responsabilidad criminal. Si el error fuera vencible, se aplicará la pena inferior en uno o dos grados.</p></div>
<p>La distinción, aparentemente técnica, decide si una persona entra o no en prisión. Los tribunales valoran para ello las circunstancias del caso y las personales del autor: su formación, su profesión y la facilidad con la que podía haberse informado<sup><a href="#nota-3" id="ref-3">3</a></sup>.</p>

<h2 id="conclusiones"><span class="hl-num">VI.</span> Conclusiones</h2>
<p>La teoría del delito no resuelve los casos por sí sola, pero ordena las preguntas. Cada categoría actúa como un filtro: el hecho que no la supera sale del sistema y no llega a la siguiente. Entender ese orden es la mejor manera de leer una sentencia penal y, sobre todo, de detectar cuándo una resolución se ha saltado un paso.</p>
<ol>
<li>La acción delimita qué hechos pueden interesar al Derecho penal.</li>
<li>La tipicidad concreta el principio de legalidad.</li>
<li>La antijuridicidad incorpora las permisiones del ordenamiento.</li>
<li>La culpabilidad garantiza que solo se castigue a quien podía obrar de otro modo.</li>
</ol>
`;

export const notes = [
    {
        id: 1,
        text: "Artículo 10 de la Ley Orgánica 10/1995, de 23 de noviembre, del Código Penal.",
    },
    {
        id: 2,
        text: "WELZEL, H., El nuevo sistema del Derecho penal. Una introducción a la doctrina de la acción finalista, trad. J. Cerezo Mir, Ariel, Barcelona, 1964.",
    },
    {
        id: 3,
        text: "Véase, con carácter general, STC 76/2019, de 22 de mayo, FJ 5; DOUE L 119, de 4 de mayo de 2016, pp. 1–88.",
    },
];

export const bibliography = [
    "MIR PUIG, S., Derecho penal. Parte general, 10.ª ed., Reppertor, Barcelona, 2016.",
    "MUÑOZ CONDE, F. y GARCÍA ARÁN, M., Derecho penal. Parte general, 11.ª ed., Tirant lo Blanch, Valencia, 2022.",
    "ROXIN, C., Derecho penal. Parte general. Tomo I: Fundamentos. La estructura de la teoría del delito, trad. D.-M. Luzón Peña et al., Civitas, Madrid, 1997.",
    "WELZEL, H., El nuevo sistema del Derecho penal, trad. J. Cerezo Mir, Ariel, Barcelona, 1964.",
];
