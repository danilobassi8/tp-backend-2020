import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { ImageUploaderService } from '../../services/image-uploader.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { UserService } from 'src/app/services/user.service';
declare var M: any;

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  constructor(
    private snackBar: MatSnackBar,
    private userService: UserService,
    private imgService: ImageUploaderService,
    private router: Router
  ) {}

  storagedUser: any = {};
  readonly defaultUserImageURL: string =
    'https://res.cloudinary.com/elcurco8/image/upload/v1598910919/TTADS-TP/user_ybrhuc.png';

  mainForm = new FormGroup({
    usuario: new FormControl({ value: '', disabled: true }),
    pass: new FormControl('', [Validators.minLength(6), Validators.required]),
    pass_repeat: new FormControl('', [
      Validators.minLength(6),
      Validators.required,
    ]),
    tipo: new FormControl(''),
    cuil: new FormControl(''),
    nombre: new FormControl('', [Validators.minLength(2)]),
    localidad: new FormControl(''),
    direccion: new FormControl(''),
    telefono: new FormControl(''),
    mail: new FormControl('', Validators.email),
  });
  tipoUsuario = 'particular';

  urlImagen = null;
  imageFile = null;

  ngOnInit(): void {
    if (!this.userService.isLoggedIn()) {
      this.router.navigate(['login']);
    }

    M.AutoInit();
    M.updateTextFields();
    this.storagedUser = this.userService.getLocalUser();

    // si no tiene imagen por defecto le asigno una.
    if (this.storagedUser.url == null) {
      this.storagedUser.url = this.defaultUserImageURL;
    }
    this.patchStoragedUser();
  }

  openSnackBar(message: string, action: string): void {
    // metodo para que aparezca en pantalla un snack para informar al usuario.
    this.snackBar.open(message, action, {
      duration: 2000,
    });
  }

  async subirImagenYObtenerURL(): Promise<any> {
    // subo la imagen y obtengo su url.
    return this.imgService.subirImagenes(this.imageFile);
  }

  onFileSelected(event): void {
    // guardo la imagen seleccionada dentro de la propiedad ImageFile.
    this.imageFile = event.target.files;
  }

  patchStoragedUser(): void {
    this.mainForm.patchValue({
      usuario: this.storagedUser.usuario,
      tipo: this.storagedUser.tipo,
      cuil: this.storagedUser.cuil,
      nombre: this.storagedUser.nombre,
      localidad: this.storagedUser.localidad,
      direccion: this.storagedUser.direccion,
      telefono: this.storagedUser.telefono,
      mail: this.storagedUser.mail,
    });
    this.tipoUsuario = this.storagedUser.tipo;
  }

  async editUser(): Promise<any> {
    // antes de editar reviso que las pass coincidan.
    if (
      this.mainForm.controls.pass.value !==
      this.mainForm.controls.pass_repeat.value
    ) {
      this.openSnackBar('Las contraseñas no coinciden', '¡Entendido!');
    } else {
      // si habia imagen, la subo:
      this.subirImagenYObtenerURL().then((res) => {
        let URL = [];
        if (res == null) {
          const user = this.userService.getLocalUser();
          if (user == null) {
            URL = [this.defaultUserImageURL];
          } else {
            URL = [user.url];
          }
        } else {
          for (const i of res) {
            URL.push(i.url);
          }
        }
        // edito al usuario.
        this.userService
          .editUser(
            this.mainForm.controls,
            this.tipoUsuario,
            URL[0],
            this.storagedUser._id
          )
          .subscribe(
            () => {
              // actualizo la imagen
              this.urlImagen = URL;
              // guardo localmente al usuario actualizado
              this.userService.updateStoragedUser(
                this.mainForm.controls,
                URL[0],
                this.tipoUsuario,
                this.storagedUser._id
              );
              // actualizo la promiedad storagedUser para que se renderizen bien el html
              this.storagedUser = JSON.parse(localStorage.getItem('user'));
              this.openSnackBar('¡Su usuario ha sido actualizado!', 'OK');
            },
            () => {
              this.snackBar
                .open('Error al editar perfil', 'Ir al Login', {
                  duration: 5000,
                })
                .onAction()
                .subscribe(() => {
                  this.userService.clearLocalStoragedUser();
                  this.router.navigate(['/login']);
                });
            }
          );

        this.imageFile = null;
      });
    }
  }
}
