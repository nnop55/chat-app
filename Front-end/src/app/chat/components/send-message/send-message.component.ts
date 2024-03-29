import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import { WebSocketService } from '../../services/web-socket.service';
import { SharedService } from '../../services/shared.service';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-send-message',
  templateUrl: './send-message.component.html',
  styleUrls: ['./send-message.component.scss']
})
export class SendMessageComponent {

  @ViewChild('messageContainer') messageContainer!: ElementRef;

  messageControl = new FormControl('', [Validators.required]);
  showEmojiPicker: boolean = false
  webSocket = inject(WebSocketService);
  shared = inject(SharedService);
  userId!: string | null
  isTyping: boolean = false

  @Input() sendTo: any;
  @Input() messagesData: any = new Object()
  @Output() emitClick: EventEmitter<any> = new EventEmitter<any>()

  ngOnInit(): void {
    this.userId = sessionStorage.getItem("userId")
    this.scrollToBottom();
    this.shared.scroll$.subscribe((ev: any) => {
      ev == 'clicked' && this.scrollToBottom()
    })

    this.messageControl.valueChanges.subscribe((msg: any) => {
      this.webSocket.userTyping(this.userId, this.sendTo['_id'], msg)
    })

    this.webSocket.handleSocketObserver('messageTyping').subscribe((data) => {
      this.isTyping = data['typing'] && data['userId'] != this.userId
      this.scrollToBottom();
    })
  }

  handleEmojiSelect(event: any): void {
    const currMsg = this.messageControl?.value
    this.messageControl?.setValue(currMsg + event.emoji.native)
  }

  get activeUsers() {
    return this.webSocket.activeUsers
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const container = this.messageContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }, 10);
  }

  sendMessage() {
    if (this.messageControl.invalid) {
      return
    }

    if (this.userId) {
      this.webSocket.sendMessage(this.sendTo['chatId'], this.userId, this.sendTo['_id'], this.messageControl?.value);
      if (!this.messagesData['messages']) this.messagesData['messages'] = []
      this.showEmojiPicker = false
      this.scrollToBottom()
    }

    this.messageControl.setValue('');
  }

  back() {
    this.emitClick.emit({ content: 'list' })
  }
}
