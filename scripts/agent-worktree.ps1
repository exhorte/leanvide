param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('project-management','product-architecture','frontend','rust-core','platform','ai-asr','backend','qa-release','security')]
    [string]$Role
)

$ErrorActionPreference = 'Stop'
$repoRoot = (git rev-parse --show-toplevel).Trim()
if (-not $repoRoot) { throw 'Ce dossier ne se trouve pas dans un depot Git.' }

$repoParent = Split-Path -Parent $repoRoot
$worktreesRoot = Join-Path $repoParent 'leanvibe-worktrees'
$target = Join-Path $worktreesRoot $Role
$branch = "work/$Role"

$resolvedParent = [IO.Path]::GetFullPath($repoParent)
$resolvedTarget = [IO.Path]::GetFullPath($target)
if (-not $resolvedTarget.StartsWith($resolvedParent + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'La cible du worktree sort du dossier projet autorise.'
}

if (Test-Path -LiteralPath $target) {
    Write-Output "Worktree deja present: $target"
    exit 0
}

New-Item -ItemType Directory -Path $worktreesRoot -Force | Out-Null
git fetch origin develop $branch
if ($LASTEXITCODE -ne 0) { throw 'Echec du fetch Git.' }

$localBranch = git branch --list $branch
if ($localBranch) {
    git worktree add $target $branch
} else {
    git worktree add -b $branch $target "origin/$branch"
}
if ($LASTEXITCODE -ne 0) { throw 'Echec de creation du worktree.' }

Write-Output "Worktree pret: $target"
Write-Output "Branche: $branch"
