# Push & Git — ECOPRO2

## Remote

```bash
git remote -v
# origin  git@github-nuovo:owltechengineer/ECOPRO2.git (fetch)
# origin  git@github-nuovo:owltechengineer/ECOPRO2.git (push)
```

## SSH (owltechengineer)

Il repo usa l'alias `github-nuovo` per SSH. In `~/.ssh/config`:

```
Host github-nuovo
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_nuovo
    IdentitiesOnly yes
```

Remote URL: `git@github-nuovo:owltechengineer/ECOPRO2.git`

## Comandi push

```bash
# Branch principale
git branch -M main

# Push
git add .
git commit -m "messaggio"
git push -u origin main
```

## Prima del push

1. **Build**: `npm run build` — assicurati che compili senza errori
2. **Nessun secret**: `.env.local` è in `.gitignore`, non committare chiavi
3. **GitHub Push Protection**: se blocca per secrets nella history, usa un repo pulito (come fatto per l’initial commit)

## Branch

- `main` — branch principale, tracciato su `origin/main`
