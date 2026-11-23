export interface ItemCandidato {
  id_experiencia_evidencia: { toString(): string };
}

/**
 * Elige el siguiente ítem repartiendo entre las evidencias incluidas: prefiere la evidencia
 * con menos presentaciones y, si empatan, una distinta a la del turno anterior. Los demás
 * empates se resuelven por el orden de `ordenEvidencias`, y dentro de la evidencia por el
 * orden de `disponibles`.
 */
export function elegirItem<T extends ItemCandidato>(
  disponibles: T[],
  ordenEvidencias: string[],
  conteoPorEvidencia: Map<string, number>,
  ultimaEvidencia?: string,
): T | undefined {
  const conItems = ordenEvidencias.filter((idEvidencia) =>
    disponibles.some(
      (item) => item.id_experiencia_evidencia.toString() === idEvidencia,
    ),
  );
  if (conItems.length === 0) {
    return undefined;
  }

  const conteo = (idEvidencia: string) =>
    conteoPorEvidencia.get(idEvidencia) ?? 0;
  const menor = Math.min(...conItems.map(conteo));
  const empatadas = conItems.filter(
    (idEvidencia) => conteo(idEvidencia) === menor,
  );
  const elegida =
    empatadas.find((idEvidencia) => idEvidencia !== ultimaEvidencia) ??
    empatadas[0];

  return disponibles.find(
    (item) => item.id_experiencia_evidencia.toString() === elegida,
  );
}
