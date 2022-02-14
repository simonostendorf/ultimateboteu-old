let startTime = 0;

export function millisToString(millis: number, printMillis: boolean): string {
  const days = Math.floor(millis / 86400000);
  millis %= 86400000;
  const hours = Math.floor(millis / 3600000);
  millis %= 3600000;
  const minutes = Math.floor(millis / 60000);
  millis %= 60000;
  const seconds = Math.floor(millis / 1000);
  millis %= 1000;

  let output = '';

  let inserted = false;

  if (days > 0) {
    output += days + ' Tag';
    if (days > 1) {
      output += 'e';
    }
    inserted = true;
  }
  if (hours > 0) {
    if (inserted) {
      inserted = false;
      output += ' ';
    }
    output += hours + ' Stunde';
    if (hours > 1) {
      output += 'n';
    }
    inserted = true;
  }
  if (minutes > 0) {
    if (inserted) {
      inserted = false;
      output += ' ';
    }
    output += minutes + ' Minute';
    if (minutes > 1) {
      output += 'n';
    }
    inserted = true;
  }
  if (seconds > 0) {
    if (inserted) {
      inserted = false;
      output += ' ';
    }
    output += seconds + ' Sekunde';
    if (seconds > 1) {
      output += 'n';
    }
    inserted = true;
  }
  if (printMillis) {
    if (millis > 0) {
      if (inserted) {
        inserted = false;
        output += ' ';
      }
      output += millis + ' Millisekunde';
      if (millis > 1) {
        output += 'n';
      }
    }
  }

  return output;
}

export function setStartTime() {
  startTime = Date.now();
}

export function getStartTime(): number {
  return startTime;
}

export function getUptime(): number {
  return Date.now() - startTime;
}