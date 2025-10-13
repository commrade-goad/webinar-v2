export type AttTypeEnum = "online" | "offline";
export type UserEventRoleEnum = "normal" | "committee";

export interface IEvent {
	ID: number;

	// DONT CARE
	CreatedAt: string;
	UpdatedAt: string;
	DeletedAt?: string | null;
	// DONT CARE

	EventDesc: string;
	EventName: string;
	EventImg: string;
	EventMax: number;
	EventDStart: string; // ISO datetime string
	EventDEnd: string;   // ISO datetime string
	EventLink: string;
	EventSpeaker: string;
	EventAtt: AttTypeEnum;

	EventMaterials: EventMaterial[];
	EventParticipants: EventParticipant[];
	CertTemplates: CertTemplate[];
}

export interface EventMaterial {
	ID: number;
	CreatedAt: string;
	UpdatedAt: string;
	DeletedAt?: string | null;

	EventId: number;
	EventMAttach: string;

	Event?: Event;
}

export interface CertTemplate {
	ID: number;
	CreatedAt: string;
	UpdatedAt: string;
	DeletedAt?: string | null;

	CertTemplate: string;
	EventId: number;

	Event?: Event;
}

export interface EventParticipant {
	ID: number;
	CreatedAt: string;
	UpdatedAt: string;
	DeletedAt?: string | null;

	EventId: number;
	UserId: number;
	EventPRole: UserEventRoleEnum;
	EventPCome: boolean;
	EventPCode: string;

	Event?: Event;
	User?: User;
}

export interface User {
	ID: number;

	// UNUSED
	CreatedAt: string;
	UpdatedAt: string;
	DeletedAt?: string | null;
	UserCreatedAt: string; // datetime string
	// UNUSED

	UserFullName: string;
	UserEmail: string;
	UserInstance: string;
	UserRole: number;
	UserPicture: string; //IGNORE

	EventParticipants?: EventParticipant[];
}

export interface OTP {
	ID: number;
	CreatedAt: string;
	UpdatedAt: string;
	DeletedAt?: string | null;

	UserEmail: string;
	OtpCode: string;
	TimeCreated: string; // datetime string
	Used: boolean;
}

export interface ApiResponse<T> {
	data: T;
	success: boolean;
	message: string;
	error_code: number;
}
