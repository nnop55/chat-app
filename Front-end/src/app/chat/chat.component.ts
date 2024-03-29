import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { WebSocketService } from './services/web-socket.service';
import { ActivatedRoute } from '@angular/router';
import { LoadingService } from './services/loading.service';
import { SharedService } from './services/shared.service';
import { AuthService } from './services/auth.service';
import { delay } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {

  webSocket = inject(WebSocketService);
  acRoute = inject(ActivatedRoute);
  loadingService = inject(LoadingService);
  shared = inject(SharedService);
  auth = inject(AuthService)
  content: "auth" | "list" | "messages" = "auth"
  sendTo: any;
  messagesData: any = new Object()
  isLoading: boolean = true
  userId: any

  ngOnInit(): void {
    this.loading()
    this.auth.userId$
      .pipe(delay(500))
      .subscribe(userId => {
        if (userId) {
          this.userId = userId
          this.listener()
        }
      })
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: Event) {
    this.webSocket.emitUserInactive(this.userId)
    this.webSocket.closeConnection();
  }

  loading() {
    this.loadingService.loading$.subscribe(loading => {
      this.isLoading = loading
    })
  }

  listener() {
    this.webSocket.handleSocketObserver('sendMessage').subscribe((data: any) => {
      if (!this.messagesData['messages']) this.messagesData['messages'] = []
      data['fromMe'] = data.userId == this.userId
      this.messagesData['messages'].push(data)
      this.shared.setScrollState('clicked')
    });

    if (this.userId) {
      this.content = "list"
      this.webSocket.onLoad(this.userId);
    }
  }

  handleListAction(event: any) {
    if (event.user) {
      this.sendTo = event.user
      this.content = event.content
      if (event.chatData) {
        this.messagesData = event.chatData
        this.sendTo['chatId'] = event.chatData['chatId']
      }
    } else {
      this.content = event.content
    }

  }

  ngOnDestroy(): void {
    this.webSocket.closeConnection();
  }
}
