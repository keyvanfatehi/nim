  /* * * * * * * * * * * * * * * * * * * * * * *\ 
   * Nim (a.k.a "Network Vim")
   * http://github.com/keyvanfatehi/nim
   * Copyright (c) Keyvan Fatehi 2011
  \* * * * * * * * * * * * * * * * * * * * * * */ 
#include "nim.h"

int main(int argc, char *argv[]) {
  struct pollfd ufds[2];

  connectSocket(&sockfd, HOSTNAME, PORT);
  startupArgumentsHandler(argc, argv);

  ufds[0].fd = sockfd;
  ufds[0].events = POLLIN;
  ufds[1].fd = STDIN_FILENO;
  ufds[1].events = POLLIN;
  
  initGui();

  while(1) {
    switch(poll(ufds, 2, -1)) {
      case -1:{ perror("poll()"); break; }
      default:{
        //if (ufds[0].revents & POLLIN) onKeyData();
        if (ufds[1].revents & POLLIN) onSocketData();
      }
    }
  }
  writeSocket(sockfd, "Quitting");
  close(sockfd);
  endwin();     /* End curses mode      */
  exit(0);
}

void onSocketData() {
  // char buffer[BIGBUF];
  // int bytes;
  // memset(buffer, 0, BIGBUF);
  // bytes = readSocket(sockfd, buffer, BIGBUF);
  // mvprintw(LINES - 4, 0, "SOCKET: Received %d bytes. Data: %s", bytes, buffer);
  // 
}

void onKeyData() {
  char *str;
  getstr(str);
  mvprintw(LINES - 2, 0, "You entered: %s", str);
}

// void onKeyData() {
//   char buffer[SMALLBUF];
//   //int bytes;
//   memset(buffer, 0, SMALLBUF);
//   //bytes = read(STDIN_FILENO, buffer, SMALLBUF);
//   
//   mvprintw(LINES - 2, 0, "You entered: %s", buffer);
//   // 
//   // getch();     /* Wait for user input */
//   // endwin();     /* End curses mode      */
//   
//   //printf("STDIN: Receieved %d bytes. Data: %s END STDIN\n", bytes, buffer);
// }