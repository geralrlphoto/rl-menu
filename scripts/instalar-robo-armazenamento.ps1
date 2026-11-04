# Cria a tarefa do Windows "RL Armazenamento": de 2 em 2 minutos corre o robô dos discos
# (scripts/indexar-disco.py --robo). Correr uma vez:  powershell -ExecutionPolicy Bypass -File scripts\instalar-robo-armazenamento.ps1
$py = 'C:\Users\Rui\AppData\Local\Programs\Python\Python311\pythonw.exe'
$script = Join-Path $PSScriptRoot 'indexar-disco.py'
$acao = New-ScheduledTaskAction -Execute $py -Argument "-I `"$script`" --robo"
$quando = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 2)
$opcoes = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 30) -StartWhenAvailable
Register-ScheduledTask -TaskName 'RL Armazenamento' -Action $acao -Trigger $quando -Settings $opcoes -Force `
  -Description 'Lê os discos USB para a página /armazenamento (botão Atualizar e discos novos). Log em %LOCALAPPDATA%\rl-armazenamento.log' | Out-Null
Get-ScheduledTask 'RL Armazenamento' | Select-Object TaskName, State
