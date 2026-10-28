/** Échec d'ouverture de la base locale (navigation privée stricte, stockage bloqué ou plein). */
export function StartupError() {
  return (
    <div role="alert" className="mx-auto flex min-h-dvh max-w-[480px] flex-col justify-center gap-3 p-6">
      <h1 className="display text-[28px] text-ink">Impossible d’ouvrir les données locales</h1>
      <p className="text-[14px] text-ink-2">
        Le navigateur refuse l’accès au stockage (navigation privée, données de site bloquées ou espace insuffisant).
        Aucune donnée n’a été modifiée. Autorise le stockage pour ce site puis recharge la page.
      </p>
      <button type="button" onClick={() => window.location.reload()} className="mt-2 h-10 self-start rounded-md bg-ink px-4 text-[14px] font-medium text-bg">Recharger</button>
    </div>
  )
}
